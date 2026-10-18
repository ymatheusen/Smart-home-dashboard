import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const prefix = "/Smart-home-dashboard/";
const root = resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const file = resolve(root, pathname.slice(prefix.length) || "index.html");
  if (!pathname.startsWith(prefix) || !file.startsWith(root + "/")) {
    res.writeHead(404).end();
    return;
  }
  try {
    const contents = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(contents);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
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
  const url = `http://127.0.0.1:${server.address().port}${prefix}?v=0.2.0`;
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
