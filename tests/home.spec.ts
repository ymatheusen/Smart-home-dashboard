import { test, expect } from "@playwright/test";

test("demo controls, persistence, scenes and doorbell", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welkom thuis." }),
  ).toBeVisible();
  await page.getByRole("switch", { name: "Woonkamerverlichting" }).click();
  await expect(
    page.getByRole("switch", { name: "Woonkamerverlichting" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(
    page.getByRole("switch", { name: "Woonkamerverlichting" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Goedemorgen", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Woonkamerverlichting" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("switch", { name: "Keukenverlichting" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Volgend nummer" }).click();
  await expect(
    page.getByRole("heading", { name: "A Walk", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Muziek afspelen" }).click();
  await expect(
    page.getByRole("button", { name: "Muziek pauzeren" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Test deurbel" }).click();
  await expect(
    page.getByRole("heading", { name: "De deurbel gaat" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Venster sluiten" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await page.getByLabel("Naam van je woning").fill("Ons fijne thuis");
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Mijn Woning, Home" }),
  ).toContainText("Ons fijne thuis");
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 800, height: 1280 },
  { width: 1200, height: 1920 },
]) {
  test(`responsive layout ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation", { name: "Hoofdnavigatie" }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/home-${viewport.width}.png`,
      fullPage: true,
    });
  });
}

test("shutter can move and stop; doorbell closes automatically", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByText("Wordt geopend…")).toBeVisible();
  await page.getByRole("button", { name: "Rolluik stoppen" }).click();
  await expect(page.getByText("Wordt geopend…")).not.toBeVisible();
  await page.clock.install();
  await page.getByRole("button", { name: "Test deurbel" }).click();
  await page.clock.fastForward(46_000);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
