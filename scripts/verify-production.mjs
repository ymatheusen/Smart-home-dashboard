import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startProductionServer } from "./production-server.mjs";

const { server, url } = await startProductionServer();
let browser;
try {
  browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  );
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(url);
  assert.equal(response.status(), 200);
  await page.getByRole("heading", { name: "Welkom thuis." }).waitFor();
  await page.getByRole("switch", { name: "Woonkamerverlichting" }).click();
  assert.equal(
    await page
      .getByRole("switch", { name: "Woonkamerverlichting" })
      .getAttribute("aria-checked"),
    "false",
  );
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await page.getByRole("button", { name: "Simuleer aanbellen" }).click();
  await page.getByRole("heading", { name: "De deurbel gaat" }).waitFor();
  assert.deepEqual(errors, []);

  const blockedPage = await browser.newPage();
  await blockedPage.route("**/assets/*.js", (route) => route.abort());
  await blockedPage.goto(url);
  await blockedPage
    .getByText("Het dashboard kon niet worden geladen.", { exact: false })
    .waitFor();
  console.log(
    "Production verified at GitHub Pages subpath: rendered Home, working controls, no console errors, visible fallback when JavaScript fails.",
  );
} finally {
  await browser?.close();
  server.close();
}
