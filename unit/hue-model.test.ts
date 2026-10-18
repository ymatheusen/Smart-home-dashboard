import test from "node:test";
import assert from "node:assert/strict";
import { parseSnapshot, colorToXy } from "../src/hue/model.ts";
const id = (n: number) =>
  `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
const bridge = {
  id: "001788fffe123456",
  ip: "192.168.1.2",
  name: "Mijn Hue Bridge",
};
const sample = () => ({
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
      on: { on: true },
      dimming: { brightness: 68 },
      color: {},
      color_temperature: {
        mirek: null,
        mirek_schema: { mirek_minimum: 153, mirek_maximum: 454 },
      },
    },
    {
      id: id(4),
      type: "zigbee_connectivity",
      owner: { rid: id(2) },
      status: "disconnected",
    },
    {
      id: id(5),
      type: "scene",
      metadata: { name: "Avond" },
      group: { rid: id(1) },
      status: { active: "static" },
    },
    { id: id(6), type: "zone", metadata: { name: "Beneden" } },
    {
      id: id(7),
      type: "scene",
      metadata: { name: "Avond" },
      group: { rid: id(6) },
      status: { active: "inactive" },
    },
  ],
});
test("bridge scenes retain their IDs and distinguish identical names by room", () => {
  const input = sample(),
    before = JSON.stringify(input),
    snapshot = parseSnapshot(input);
  assert.equal(snapshot.scenes.length, 2);
  assert.deepEqual(
    snapshot.scenes.map((s) => [s.name, s.room]),
    [
      ["Avond", "Beneden"],
      ["Avond", "Woonkamer"],
    ],
  );
  assert.equal(snapshot.scenes.find((s) => s.id === id(5))?.active, true);
  assert.equal(JSON.stringify(input), before);
  input.data[4].metadata = { name: "Nieuwe naam in Hue" };
  assert.equal(
    parseSnapshot(input).scenes.find((s) => s.id === id(5))?.name,
    "Nieuwe naam in Hue",
  );
});
test("offline lamps remain identifiable and temperature capability survives color mode", () => {
  const light = parseSnapshot(sample()).lights[0];
  assert.equal(light.name, "Leeslamp");
  assert.equal(light.room, "Woonkamer");
  assert.equal(light.reachable, false);
  assert.equal(light.temperature, true);
  assert.equal(light.mirek, null);
  assert.equal(light.maxMirek, 454);
});
test("malformed data and bridge API errors cannot produce a successful snapshot", () => {
  assert.throws(() =>
    parseSnapshot({
      errors: [{ description: "No authorization" }],
      bridge,
      data: [],
    }),
  );
  assert.throws(() => parseSnapshot({ errors: [], data: [] }));
  const raw = sample();
  raw.data.push({ id: "../../auth_v1", type: "light" } as any);
  assert.equal(parseSnapshot(raw).lights.length, 1);
});
test("color conversion stays finite and valid for native commands", () => {
  for (const hex of [
    "#000000",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#e8bd78",
  ]) {
    const xy = colorToXy(hex);
    assert(Number.isFinite(xy.x) && Number.isFinite(xy.y));
    assert(xy.x >= 0 && xy.y >= 0 && xy.x + xy.y <= 1);
  }
  assert.throws(() => colorToXy("javascript:invalid"));
});
