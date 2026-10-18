import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  rmSync,
  cpSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const source = process.cwd();
for (const file of [
  "dist/index.html",
  "dist/sw.js",
  "dist/manifest.webmanifest",
  "dist/icons/icon-192.png",
  "dist/icons/icon-512.png",
  "dist/icons/maskable-512.png",
  "dist-standalone/index.html",
]) {
  if (!existsSync(file))
    throw new Error(`Missing ${file}. Build the app before deploying.`);
}
const git = (args, cwd = source) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const remote = git(["remote", "get-url", "origin"]);
const target = mkdtempSync(join(tmpdir(), "mijn-woning-pages-"));
try {
  git([
    "clone",
    "--quiet",
    "--single-branch",
    "--branch",
    "gh-pages",
    "--depth",
    "1",
    remote,
    target,
  ]);
  for (const entry of readdirSync(target)) {
    if (entry !== ".git" && entry !== "android")
      rmSync(join(target, entry), { recursive: true, force: true });
  }
  cpSync(resolve("dist"), target, { recursive: true });
  writeFileSync(join(target, ".nojekyll"), "");
  mkdirSync(join(target, "download"));
  cpSync(
    resolve("dist-standalone/index.html"),
    join(target, "download/Mijn-Woning.html"),
  );
  if (existsSync("artifacts/android/Mijn-Woning.apk")) {
    const metadata = JSON.parse(
      readFileSync("artifacts/android/release.json", "utf8"),
    );
    const apk = readFileSync("artifacts/android/Mijn-Woning.apk");
    if (createHash("sha256").update(apk).digest("hex") !== metadata.apkSha256)
      throw new Error("Android APK checksum mismatch.");
    mkdirSync(join(target, "android"), { recursive: true });
    writeFileSync(join(target, "android/Mijn-Woning.apk"), apk);
    writeFileSync(
      join(target, "android/release.json"),
      JSON.stringify(metadata, null, 2),
    );
    writeFileSync(
      join(target, "android/index.html"),
      `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#141614"><title>Mijn Woning voor Android</title><style>body{background:#141614;color:#e7eadf;font:16px/1.8 system-ui;max-width:620px;margin:8vh auto;padding:24px}h1,a{color:#d6b87a}a{display:inline-block;padding:12px 18px;border:1px solid #d6b87a;border-radius:12px;text-decoration:none}small{color:#9eaf8b}code{overflow-wrap:anywhere}</style><h1>Mijn Woning voor Android</h1><p>Testversie ${metadata.version}. Met lokale Hue-koppeling en je eigen Hue-scènes.</p><a href="./Mijn-Woning.apk" download="Mijn-Woning.apk">Android-app downloaden</a><ol><li>Installeer de APK op je eigen Android-telefoon of tablet.</li><li>Open het nieuwe app-icoon en ga naar Instellingen → Philips Hue.</li><li>Gebruik hetzelfde thuisnetwerk als de Bridge. Zoek de Bridge of vul het lokale IP-adres in.</li><li>Controleer de Bridge, druk op de fysieke knop en koppel.</li><li>Kies je favoriete Hue-scènes voor Home.</li></ol><p>De verbinding met je eigen Bridge moet je thuis testen. Overige apparaten blijven demo.</p><details><summary>Bestandscontrole</summary><small>SHA-256 van de APK</small><p><code>${metadata.apkSha256}</code></p></details></html>`,
    );
  }
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  writeFileSync(
    join(target, "version.json"),
    JSON.stringify({
      version: pkg.version,
      source_commit: git(["rev-parse", "HEAD"]),
      deployment: "compiled-vite-build",
      published_at: new Date().toISOString(),
    }) + "\n",
  );
  git(["add", "--all"], target);
  git(
    [
      "-c",
      "user.name=Codex",
      "-c",
      "user.email=codex@openai.com",
      "commit",
      "--quiet",
      "-m",
      `Publish Mijn Woning ${pkg.version}`,
    ],
    target,
  );
  git(["push", "origin", "HEAD:refs/heads/gh-pages"], target);
  console.log(
    `Pages branch updated: ${git(["rev-parse", "HEAD"], target)}. Wait for GitHub Pages deployment to finish.`,
  );
} catch (error) {
  // A remote can contain credentials. Never reproduce it in an error message.
  const details = error.stderr?.toString() || error.message;
  throw new Error(details.split(remote).join("[origin]"));
} finally {
  rmSync(target, { recursive: true, force: true });
}
