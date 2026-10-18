import { test, expect, type Page } from "@playwright/test";

async function revealTile(page: Page, name: string) {
  for (let i = 0; i < 4; i++) {
    if (
      await page
        .getByRole("button", { name: `${name} bedienen`, exact: true })
        .isVisible()
    )
      return;
    const next = page.getByRole("button", { name: "Volgende tegelpagina" });
    if (!(await next.isEnabled())) break;
    await next.click();
  }
  await expect(
    page.getByRole("button", { name: `${name} bedienen`, exact: true }),
  ).toBeVisible();
}

async function expectNoDashboardScroll(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        x: document.documentElement.scrollWidth <= innerWidth + 1,
        y: document.documentElement.scrollHeight <= innerHeight + 1,
      })),
    )
    .toEqual({ x: true, y: true });
  for (const tile of await page.locator(".home-tile").all()) {
    expect(
      await tile.evaluate((el) => {
        const bounds = el.getBoundingClientRect();
        return [
          ...el.querySelectorAll(
            "button, .tile-value strong, .tile-value > span",
          ),
        ].every((child) => {
          const rect = child.getBoundingClientRect();
          return (
            rect.top >= bounds.top - 1 &&
            rect.bottom <= bounds.bottom + 1 &&
            rect.left >= bounds.left - 1 &&
            rect.right <= bounds.right + 1
          );
        });
      }),
    ).toBe(true);
  }
}

test("demo controls, scenes, persistence and doorbell", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welkom thuis." }),
  ).toBeVisible();
  await page.getByRole("switch", { name: "Woonkamerverlichting" }).click();
  await page.reload();
  await expect(
    page.getByRole("switch", { name: "Woonkamerverlichting" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Goedemorgen", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Woonkamerverlichting" }),
  ).toHaveAttribute("aria-checked", "true");
  await revealTile(page, "Muziek");
  await page.getByRole("button", { name: "Volgend nummer" }).click();
  await expect(page.getByText("A Walk", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Muziek afspelen" }).click();
  await expect(
    page.getByRole("button", { name: "Muziek pauzeren" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await page.getByRole("button", { name: "Simuleer aanbellen" }).click();
  await expect(
    page.getByRole("heading", { name: "De deurbel gaat" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Venster sluiten" }).click();
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
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 800, height: 1280 },
  { width: 1200, height: 1920 },
  { width: 1366, height: 768 },
]) {
  test(`all five screens fit without dashboard scrolling ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    for (const density of ["Ruim", "Normaal", "Compact"]) {
      await page
        .getByRole("button", { name: "Instellingen", exact: true })
        .click();
      await page
        .getByRole("radio", { name: new RegExp(`^${density}`) })
        .check();
      await page.getByRole("button", { name: "Klaar", exact: true }).click();
      for (const screen of [
        "Home",
        "Kamers",
        "Klimaat",
        "Camera",
        "Techniek",
      ]) {
        await page.getByRole("button", { name: screen, exact: true }).click();
        await expectNoDashboardScroll(page);
      }
    }
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.screenshot({
      path: `test-results/home-${viewport.width}.png`,
      fullPage: true,
    });
  });
}

test("layout editor remembers order, visibility and independent device profiles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await page.getByRole("radio", { name: /^Compact/ }).check();
  await page.getByRole("checkbox", { name: "Toon Muziek op Home" }).uncheck();
  await page.getByRole("checkbox", { name: "Toon Voordeur op Home" }).check();
  for (let i = 0; i < 4; i++)
    await page
      .getByRole("button", { name: "Verplaats Voordeur omhoog" })
      .click();
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  await expect(page.locator(".home-tile").first()).toContainText("Voordeur");
  await page.reload();
  await expect(page.locator(".dashboard-shell")).toHaveClass(/density-compact/);
  await expect(page.locator(".home-tile").first()).toContainText("Voordeur");
  await page.setViewportSize({ width: 800, height: 1280 });
  await expect(page.locator(".dashboard-shell")).toHaveClass(/density-normal/);
  await expect(page.locator(".home-tile").first()).toContainText("Verlichting");
  await expect(
    page.getByRole("button", { name: "Voordeur bedienen", exact: true }),
  ).toHaveCount(0);
});

test("shutter details move and stop; doorbell closes automatically", async ({
  page,
}) => {
  await page.goto("/");
  await revealTile(page, "Rolluik");
  await page
    .getByRole("button", { name: "Rolluik bedienen", exact: true })
    .click();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByText("Wordt geopend…")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Rolluik stoppen" })
    .click();
  await expect(page.getByText("Wordt geopend…")).not.toBeVisible();
  await page.getByRole("button", { name: "Venster sluiten" }).click();
  await page.clock.install();
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await page.getByRole("button", { name: "Simuleer aanbellen" }).click();
  await page.clock.fastForward(46_000);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("swiping changes screens and technical warnings are reversible", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("main")
    .dispatchEvent("pointerdown", {
      clientX: 300,
      clientY: 200,
      pointerType: "touch",
    });
  await page
    .locator("main")
    .dispatchEvent("pointerup", {
      clientX: 100,
      clientY: 205,
      pointerType: "touch",
    });
  await expect(
    page.getByRole("button", { name: "Kamers", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Techniek", exact: true }).click();
  await page.getByRole("button", { name: "Simuleer lage waterdruk" }).click();
  await expect(page.getByText("1 voorbeeldwaarschuwing")).toBeVisible();
  await page
    .getByRole("button", { name: "Herstel voorbeeldwaterdruk" })
    .click();
  await expect(
    page.getByText("Je woning in balans", { exact: true }),
  ).toBeVisible();
});
