import { test, expect } from "@playwright/test";

test("native Hue flow: pair read-only, use original scenes, control lamps and block offline commands", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const win = window as any;
    const id = (n: number) =>
      `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
    const bridge = {
      ip: "192.168.1.2",
      id: "001788fffe123456",
      name: "Mijn Bridge",
    };
    let paired = sessionStorage.getItem("test.hue.paired") === "true",
      on = true,
      brightness = 68,
      active = false;
    win.__hueCalls = [];
    win.__hueOffline = false;
    win.androidBridge = {};
    const snapshot = () => ({
      errors: [],
      bridge,
      data: [
        {
          id: id(1),
          type: "room",
          metadata: { name: "Woonkamer" },
          children: [{ rtype: "device", rid: id(2) }],
        },
        { id: id(2), type: "device" },
        {
          id: id(3),
          type: "light",
          owner: { rid: id(2) },
          metadata: { name: "Leeslamp" },
          on: { on },
          dimming: { brightness },
          color: {},
          color_temperature: {
            mirek: 370,
            mirek_schema: { mirek_minimum: 153, mirek_maximum: 454 },
          },
        },
        {
          id: id(4),
          type: "scene",
          metadata: { name: "Mijn avond" },
          group: { rid: id(1) },
          status: { active: active ? "static" : "inactive" },
        },
      ],
    });
    win.Capacitor = {
      PluginHeaders: [
        {
          name: "HueBridge",
          methods: [
            "status",
            "discover",
            "inspect",
            "pair",
            "getResources",
            "setLight",
            "activateScene",
            "disconnect",
          ].map((name) => ({ name, rtype: "promise" })),
        },
      ],
      nativePromise: async (_plugin: string, method: string, args: any) => {
        win.__hueCalls.push({ method, args });
        if (win.__hueOffline && method !== "status" && method !== "disconnect")
          throw new Error("Bridge is niet bereikbaar");
        if (method === "status")
          return { paired, bridge: paired ? bridge : undefined };
        if (method === "discover") return { bridges: [bridge] };
        if (method === "inspect") return bridge;
        if (method === "pair") {
          paired = true;
          sessionStorage.setItem("test.hue.paired", "true");
          return snapshot();
        }
        if (method === "getResources") return snapshot();
        if (method === "activateScene") {
          active = true;
          return { confirmed: true };
        }
        if (method === "setLight") {
          if (typeof args.on === "boolean") on = args.on;
          if (typeof args.brightness === "number") brightness = args.brightness;
          return { confirmed: true };
        }
        if (method === "disconnect") {
          paired = false;
          return {};
        }
        throw Error("Unexpected native call");
      },
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await page.getByLabel("Lokaal IP-adres van de Bridge").fill("192.168.1.2");
  await page.getByRole("button", { name: "Controleer deze Bridge" }).click();
  await expect(page.getByText("HUE-CERTIFICAAT GECONTROLEERD")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as any).__hueCalls.filter((c: any) =>
          ["setLight", "activateScene"].includes(c.method),
        ).length,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Knop ingedrukt · koppel nu" })
    .click();
  await expect(
    page.getByText("Live via 192.168.1.2", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".hue-scene-options label")
    .filter({ hasText: "Mijn avond" })
    .getByRole("checkbox")
    .check();
  await page.getByLabel("Icoon aanpassen · Mijn avond").click();
  await page
    .getByRole("button", { name: "Filmavond voor Mijn avond", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Filmavond voor Mijn avond",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Mijn Hue-scènes" }),
  ).toBeVisible();
  const scene = page.getByRole("button", { name: "Mijn avond", exact: true });
  await expect(scene.locator('[data-scene-icon="movie"]')).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Mijn Hue-scènes" }),
  ).not.toContainText("Woonkamer");
  await page.reload();
  await expect(scene.locator('[data-scene-icon="movie"]')).toBeVisible();
  await expect(scene).toBeEnabled();
  await page.getByRole("button", { name: "Mijn avond", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__hueCalls.some(
          (c: any) =>
            c.method === "activateScene" &&
            c.args.id === "00000000-0000-4000-8000-000000000004",
        ),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Verlichting bedienen", exact: true })
    .click();
  await page.getByRole("switch", { name: "Leeslamp schakelen" }).click();
  await expect(
    page.getByRole("switch", { name: "Leeslamp schakelen" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("slider", { name: /Helderheid/ }).press("Home");
  await page.getByRole("button", { name: "Lichtinstelling toepassen" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).__hueCalls.filter((c: any) => c.method === "setLight")
            .length,
      ),
    )
    .toBe(2);
  const command = await page.evaluate(
    () =>
      (window as any).__hueCalls
        .filter((c: any) => c.method === "setLight")
        .at(-1).args,
  );
  expect(command).toEqual({
    id: "00000000-0000-4000-8000-000000000003",
    brightness: 1,
  });
  await page.evaluate(() => {
    (window as any).__hueOffline = true;
  });
  await page.getByRole("button", { name: "Hue-lampen verversen" }).click();
  await expect(
    page.getByRole("switch", { name: "Leeslamp schakelen" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Venster sluiten" }).click();
  await expect(
    page.getByRole("button", { name: "Mijn avond", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Instellingen", exact: true }).click();
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("button", { name: "Klaar", exact: true }).click();
  const before = await page.evaluate(
    () =>
      (window as any).__hueCalls.filter((c: any) =>
        ["setLight", "activateScene"].includes(c.method),
      ).length,
  );
  await page.getByRole("button", { name: "Goedemorgen", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        (window as any).__hueCalls.filter((c: any) =>
          ["setLight", "activateScene"].includes(c.method),
        ).length,
    ),
  ).toBe(before);
});
