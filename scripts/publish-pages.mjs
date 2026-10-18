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
    if (entry !== ".git")
      rmSync(join(target, entry), { recursive: true, force: true });
  }
  cpSync(resolve("dist"), target, { recursive: true });
  writeFileSync(join(target, ".nojekyll"), "");
  mkdirSync(join(target, "download"));
  cpSync(
    resolve("dist-standalone/index.html"),
    join(target, "download/Mijn-Woning.html"),
  );
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
