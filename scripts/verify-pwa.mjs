import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { startProductionServer } from "./production-server.mjs";

const { server, url, nextWorker } = await startProductionServer();
const profile = mkdtempSync(join(tmpdir(), "mijn-woning-pwa-test-"));
let context;
try {
  // Chrome disables installation in incognito contexts. Use a clean, temporary
  // normal profile so installability is tested under real supported conditions.
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    viewport: { width: 390, height: 844 },
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "Welkom thuis." }),
  ).toBeVisible();
  const manifestURL = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const manifestResponse = await page.request.get(
    new URL(manifestURL, url).href,
  );
  assert.equal(manifestResponse.status(), 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, "Mijn Woning");
  assert.equal(manifest.display, "standalone");
  assert.equal(
    new URL(manifest.scope, new URL(manifestURL, url)).pathname,
    "/Smart-home-dashboard/",
  );
  assert.equal(
    new URL(manifest.start_url, new URL(manifestURL, url)).pathname,
    "/Smart-home-dashboard/",
  );
  assert(manifest.icons.some((icon) => icon.purpose === "maskable"));
  for (const icon of manifest.icons) {
    const result = await page.request.get(new URL(icon.src, url).href);
    assert.equal(result.status(), 200);
    assert.match(result.headers()["content-type"], /image\/png/);
    const png = await result.body();
    const size = Number(icon.sizes.split("x")[0]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await expect(
    page.getByText("Gereed voor offlinegebruik", { exact: true }),
  ).toBeVisible({ timeout: 20000 });
  const cdp = await context.newCDPSession(page);
  const installability = await cdp.send("Page.getInstallabilityErrors");
  assert.deepEqual(
    installability.installabilityErrors,
    [],
    "Chrome must recognize an installable app",
  );
  await page.getByLabel("Naam van je woning").fill("Ons offline thuis");
  await page.getByRole("radio", { name: /^Compact/ }).check();
  await page.getByRole("checkbox", { name: "Toon Muziek op Home" }).uncheck();
  await page.getByRole("checkbox", { name: "Toon Voordeur op Home" }).check();
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  await page.getByRole("button", { name: "Alles uit", exact: true }).click();
  const saved = await page.evaluate(() => [
    localStorage.getItem("mijn-woning.home.v1"),
    localStorage.getItem("mijn-woning.layout.v1"),
  ]);

  // The photographic background must be available after a genuine offline reload.
  const backgroundURL = await page
    .locator(".dashboard-shell")
    .evaluate((el) => {
      const background = getComputedStyle(el, "::before").backgroundImage;
      return background.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
    });
  assert(backgroundURL, "The room background must have a local asset URL");
  // Genuine offline browser navigation, not a mocked resource response.
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welkom thuis." }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Woonkamerverlichting" }),
  ).toHaveAttribute("aria-checked", "false");
  assert(
    await page.evaluate(async (url) => {
      const response = await fetch(url);
      return response.ok && (await response.blob()).size > 0;
    }, backgroundURL),
    "The room background must load through the service worker offline",
  );
  for (const name of ["Kamers", "Klimaat", "Camera", "Techniek", "Home"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await page.getByRole("button", { name: "Simuleer aanbellen" }).click();
  await expect(
    page.getByRole("heading", { name: "De deurbel gaat" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Venster sluiten" }).click();
  const reopened = await context.newPage();
  await reopened.goto(`${url}?offline-reopen=1`);
  await expect(
    reopened.getByRole("link", { name: "Mijn Woning, Home" }),
  ).toContainText("Ons offline thuis");
  await expect(reopened.locator(".dashboard-shell")).toHaveClass(
    /density-compact/,
  );
  await reopened
    .getByRole("button", { name: "Instellingen", exact: true })
    .click();
  await expect(
    reopened.getByText("Je bent offline · je demo blijft beschikbaar", {
      exact: true,
    }),
  ).toBeVisible();
  await reopened.close();
  console.log(
    "PASS: manifest, icon dimensions, app scope, offline reload/reopen, all screens, demo controls and saved preferences.",
  );

  await context.setOffline(false);
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.evaluate(async () => {
    const cache = await caches.open("unrelated-project-test");
    await cache.put("/unrelated-project/sentinel", new Response("keep"));
  });
  let navigations = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navigations += 1;
  });
  nextWorker();
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await page.getByRole("button", { name: "Controleer op updates" }).click();
  await expect(
    page.getByText("Een nieuwe versie staat klaar", { exact: true }),
  ).toBeVisible({ timeout: 20000 });
  assert.equal(navigations, 0, "Update must wait for user approval");
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  await page.getByRole("button", { name: "Update later installeren" }).click();
  await expect(
    page.getByRole("complementary", { name: "App-update" }),
  ).toHaveCount(0);
  assert.equal(navigations, 0);
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Bijwerken en heropenen" }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Welkom thuis." }),
  ).toBeVisible();
  assert(navigations > 0);
  const after = await page.evaluate(() => [
    localStorage.getItem("mijn-woning.home.v1"),
    localStorage.getItem("mijn-woning.layout.v1"),
  ]);
  assert.deepEqual(after, saved);
  assert.equal(
    await page.evaluate(async () =>
      (
        await (
          await caches.open("unrelated-project-test")
        ).match("/unrelated-project/sentinel")
      )?.text(),
    ),
    "keep",
  );
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welkom thuis." }),
  ).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real service-worker update waits, can be postponed, applies on request, preserves settings and unrelated caches, and works offline afterwards.",
  );
} finally {
  await context?.close();
  server.close();
  rmSync(profile, { recursive: true, force: true });
}
