import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  chmodSync,
  copyFileSync,
} from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { randomBytes, createHash } from "node:crypto";

const configPath = process.env.MW_ANDROID_SIGNING_CONFIG;
if (!configPath || !process.env.JAVA_HOME || !process.env.ANDROID_HOME)
  throw new Error(
    "Set JAVA_HOME, ANDROID_HOME and MW_ANDROID_SIGNING_CONFIG to a private file outside the repository. See docs/ANDROID.md.",
  );
const configFile = resolve(configPath);
if (!relative(process.cwd(), configFile).startsWith(".."))
  throw new Error("Store signing material outside this checkout.");
mkdirSync(dirname(configFile), { recursive: true, mode: 0o700 });
let config;
if (existsSync(configFile))
  config = JSON.parse(readFileSync(configFile, "utf8"));
else {
  const store = join(dirname(configFile), "mijn-woning.keystore");
  if (existsSync(store))
    throw new Error(
      "An existing keystore needs its original signing configuration. It will not be overwritten.",
    );
  config = {
    store,
    password: randomBytes(32).toString("hex"),
    alias: "mijn-woning",
  };
  const env = { ...process.env, MW_ANDROID_STORE_PASSWORD: config.password };
  execFileSync(
    join(process.env.JAVA_HOME, "bin", "keytool"),
    [
      "-genkeypair",
      "-noprompt",
      "-storetype",
      "PKCS12",
      "-keystore",
      store,
      "-storepass:env",
      "MW_ANDROID_STORE_PASSWORD",
      "-keypass:env",
      "MW_ANDROID_STORE_PASSWORD",
      "-alias",
      config.alias,
      "-keyalg",
      "RSA",
      "-keysize",
      "3072",
      "-sigalg",
      "SHA256withRSA",
      "-validity",
      "10000",
      "-dname",
      "CN=Mijn Woning Android,OU=Personal application",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  chmodSync(store, 0o600);
  writeFileSync(configFile, JSON.stringify(config), { mode: 0o600 });
}
chmodSync(configFile, 0o600);
const env = {
  ...process.env,
  MW_ANDROID_STORE_FILE: config.store,
  MW_ANDROID_STORE_PASSWORD: config.password,
  MW_ANDROID_STORE_ALIAS: config.alias,
};
execFileSync(
  "./gradlew",
  ["--no-daemon", "--max-workers=2", "testReleaseUnitTest", "assembleRelease"],
  { cwd: "android", env, stdio: "inherit" },
);
const apk = "android/app/build/outputs/apk/release/app-release.apk";
const tools = join(process.env.ANDROID_HOME, "build-tools", "34.0.0");
const verification = execFileSync(
  join(tools, "apksigner"),
  ["verify", "--verbose", "--print-certs", apk],
  { env, encoding: "utf8" },
);
if (
  !verification.includes(
    "Verified using v2 scheme (APK Signature Scheme v2): true",
  )
)
  throw new Error("APK signature verification failed.");
const cert = verification.match(
  /Signer #1 certificate SHA-256 digest: ([a-f0-9]+)/i,
)?.[1];
if (!cert) throw new Error("APK signing certificate missing.");
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const checksum = createHash("sha256").update(readFileSync(apk)).digest("hex");
mkdirSync("artifacts/android", { recursive: true });
copyFileSync(apk, "artifacts/android/Mijn-Woning.apk");
writeFileSync(
  "artifacts/android/release.json",
  JSON.stringify(
    {
      version,
      apkSha256: checksum,
      certificateSha256: cert,
      sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Signed APK ready: artifacts/android/Mijn-Woning.apk (${version}). SHA-256: ${checksum}`,
);
