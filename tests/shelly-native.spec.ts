import { test, expect } from "@playwright/test";

test("three Gen 2 modules: read-only pairing, two independent lamps, covers, offline state and demo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(() => {
    const win = window as any;
    win.__shellyCalls = [];
    win.__shellyOffline = "";
    win.androidBridge = {};
    const devices: Record<string, any> = JSON.parse(
      sessionStorage.getItem("test.shelly.devices") || "{}",
    );
    win.__shellyDevices = devices;
    const save = () =>
      sessionStorage.setItem("test.shelly.devices", JSON.stringify(devices));
    const make = (args: any) => {
      const cover = args.ip !== "192.168.1.52",
        second = args.ip === "192.168.1.51";
      return {
        id: `shellyplus2pm-${cover ? (second ? "000000000002" : "000000000001") : "000000000003"}`,
        ip: args.ip,
        name: args.name,
        profile: cover ? "cover" : "switch",
        available: true,
        channels: cover
          ? [
              {
                id: 0,
                kind: "cover",
                name: "null",
                state: "stopped",
                calibrated: !second,
                position: second ? null : 60,
                fault: false,
              },
            ]
          : [
              {
                id: 0,
                kind: "switch",
                name: "Tafellamp",
                on: false,
                fault: false,
              },
              {
                id: 1,
                kind: "switch",
                name: null,
                on: true,
                fault: false,
              },
            ],
      };
    };
    win.Capacitor = {
      PluginHeaders: [
        {
          name: "HueBridge",
          methods: ["status"].map((name) => ({ name, rtype: "promise" })),
        },
        {
          name: "Shelly",
          methods: ["list", "add", "getDevice", "remove", "command"].map(
            (name) => ({ name, rtype: "promise" }),
          ),
        },
      ],
      nativePromise: async (plugin: string, method: string, args: any) => {
        if (plugin === "HueBridge") return { paired: false };
        win.__shellyCalls.push({ method, args });
        if (method === "list") return { devices: Object.values(devices) };
        if (method === "add") {
          const device = make(args);
          devices[device.id] = device;
          save();
          return structuredClone(device);
        }
        if (args?.id === win.__shellyOffline && method !== "remove")
          throw Error("Deze Shelly is niet bereikbaar");
        if (method === "getDevice") return structuredClone(devices[args.id]);
        if (method === "remove") {
          delete devices[args.id];
          return {};
        }
        if (method === "command") {
          const c = devices[args.id].channels[args.channel];
          if (args.action === "on" || args.action === "off")
            c.on = args.action === "on";
          if (args.action === "position") {
            c.position = args.position;
            c.state = "stopped";
          }
          if (args.action === "open") c.state = "opening";
          if (args.action === "stop") c.state = "stopped";
          return { confirmed: true };
        }
        throw Error("Onverwachte native oproep");
      },
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  for (const [name, ip] of [
    ["Rolluik woonkamer", "192.168.1.50"],
    ["Rolluik keuken", "192.168.1.51"],
    ["Verlichting", "192.168.1.52"],
  ]) {
    await page.getByLabel("Naam van de module", { exact: true }).fill(name);
    await page.getByLabel("Lokaal IP-adres van de Shelly").fill(ip);
    await page
      .getByRole("button", { name: "Shelly controleren en toevoegen" })
      .click();
    await expect(
      page.locator(".shelly-saved").filter({ hasText: name }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(() =>
      (window as any).__shellyCalls.filter((c: any) => c.method === "command"),
    ),
  ).toHaveLength(0);
  const module = page
    .locator(".shelly-saved")
    .filter({ hasText: "Verlichting" });
  await module.locator("summary").click();
  const lampEditor = module
    .locator("form")
    .filter({
      has: page.getByLabel("Naam kanaal 2 · Verlichting", { exact: true }),
    });
  await page
    .getByLabel("Naam kanaal 2 · Verlichting", { exact: true })
    .fill("Wandlamp");
  await lampEditor.getByRole("button", { name: "Naam opslaan" }).click();
  await expect(
    page.getByLabel("Naam kanaal 2 · Verlichting", { exact: true }),
  ).toHaveValue("Wandlamp");
  const cover = page
    .locator(".shelly-saved")
    .filter({ hasText: "Rolluik woonkamer" });
  await cover.locator("summary").click();
  await page
    .getByLabel("Naam module · Rolluik woonkamer", { exact: true })
    .fill("Rolluik salon");
  await cover
    .locator("form")
    .first()
    .getByRole("button", { name: "Naam opslaan" })
    .click();
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [800, 1280],
    [1024, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollHeight <= window.innerHeight &&
            document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  }
  await page
    .getByRole("button", { name: "Verlichting bedienen", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Tafellamp schakelen" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("switch", { name: "Tafellamp schakelen" }).click();
  await expect(
    page.getByRole("switch", { name: "Tafellamp schakelen" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("switch", { name: "Wandlamp schakelen" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Venster sluiten" }).click();
  await page
    .getByRole("button", { name: "Volgende tegelpagina", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Rolluik salon", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Rolluik keuken", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Rolluik op Home")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.screenshot({ path: "test-results/shelly-home-phone.png" });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollHeight <= window.innerHeight &&
          document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.screenshot({ path: "test-results/shelly-home-live.png" });
  await page.getByRole("button", { name: "Rolluik keuken openen", exact: true }).click();
  await expect(page.getByRole("article", { name: "Rolluik keuken", exact: true })).toContainText("Opent…");
  await page
    .getByRole("button", { name: "Rolluik salon bedienen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Rolluik salon openen", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("article", { name: "Rolluik salon", exact: true }),
  ).toContainText("Opent…");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Rolluik salon stoppen", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("article", { name: "Rolluik salon", exact: true }),
  ).toContainText("Gestopt");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("article", { name: "Rolluik keuken", exact: true })
      .getByRole("slider"),
  ).toHaveCount(0);
  const slider = page
    .getByRole("dialog")
    .getByRole("slider", { name: /Gewenste opening/ });
  const box = (await slider.boundingBox())!;
  const beforeDrag = await page.evaluate(
    () =>
      (window as any).__shellyCalls.filter((c: any) => c.method === "command")
        .length,
  );
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await slider.fill("35");
  expect(
    await page.evaluate(
      () =>
        (window as any).__shellyCalls.filter((c: any) => c.method === "command")
          .length,
    ),
  ).toBe(beforeDrag);
  await page.mouse.up();
  await slider.blur();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Rolluikpositie toepassen" }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("dialog")
      .getByRole("article", { name: "Rolluik salon", exact: true }),
  ).toContainText("35% open");
  await page.evaluate(() => { (window as any).__shellyDevices["shellyplus2pm-000000000001"].channels[0].position = 74; });
  await page.getByRole("button", { name: "Shelly-apparaten verversen" }).click();
  await expect(slider).toHaveValue("74");
  await slider.fill("15");
  await slider.dispatchEvent("pointercancel");
  await slider.blur();
  await expect(slider).toHaveValue("74");
  const commands = await page.evaluate(() =>
    (window as any).__shellyCalls
      .filter((c: any) => c.method === "command")
      .map((c: any) => c.args),
  );
  expect(commands).toEqual([
    { id: "shellyplus2pm-000000000003", channel: 0, action: "on" },
    { id: "shellyplus2pm-000000000002", channel: 0, action: "open" },
    { id: "shellyplus2pm-000000000001", channel: 0, action: "open" },
    { id: "shellyplus2pm-000000000001", channel: 0, action: "stop" },
    {
      id: "shellyplus2pm-000000000001",
      channel: 0,
      action: "position",
      position: 35,
    },
  ]);
  await page.evaluate(() => {
    (window as any).__shellyOffline = "shellyplus2pm-000000000001";
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Shelly-apparaten verversen" })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Rolluik salon openen", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("dialog").getByRole("button", {
      name: "Rolluik salon stoppen",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Rolluik keuken openen", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Venster sluiten" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Volgende tegelpagina", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Rolluik salon", exact: true }),
  ).toBeVisible();
  const homeSlider = page.getByRole("slider", {
    name: /Gewenste opening · Rolluik salon/,
  });
  await homeSlider.press("Home");
  await expect(
    page.getByRole("article", { name: "Rolluik salon", exact: true }),
  ).toContainText("0");
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__shellyCalls
          .filter((c: any) => c.method === "command")
          .map((c: any) => c.args),
      ),
    )
    .toEqual([
      {
        id: "shellyplus2pm-000000000001",
        channel: 0,
        action: "position",
        position: 0,
      },
    ]);
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await expect(
    page.getByLabel("Naam kanaal 2 · Verlichting", { exact: true }),
  ).toHaveValue("Wandlamp");
  await page.getByRole("button", { name: "Demo Shelly", exact: true }).click();
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  await page.getByRole("button", { name: "Goedemorgen", exact: true }).click();
  expect(
    await page.evaluate(() =>
      (window as any).__shellyCalls.filter((c: any) => c.method === "command"),
    ),
  ).toHaveLength(1);
});
