export interface HueBridgeInfo {
  ip: string;
  id: string;
  name: string;
  model?: string;
}
export interface HueLight {
  id: string;
  name: string;
  room: string;
  on: boolean;
  brightness: number;
  reachable: boolean;
  dimmable: boolean;
  color: boolean;
  temperature: boolean;
  mirek: number | null;
  minMirek: number;
  maxMirek: number;
}
export interface HueScene {
  id: string;
  name: string;
  room: string;
  active: boolean;
}
export interface HueSnapshot {
  bridge: HueBridgeInfo;
  lights: HueLight[];
  scenes: HueScene[];
  updatedAt: number;
}
export type HueLightChange = {
  id: string;
  on?: boolean;
  brightness?: number;
  mirek?: number;
  x?: number;
  y?: number;
};
export interface HueTransport {
  status(): Promise<{ paired: boolean; bridge?: HueBridgeInfo }>;
  discover(): Promise<{ bridges: { ip: string; name: string }[] }>;
  inspect(input: { ip: string }): Promise<HueBridgeInfo>;
  pair(input: { ip: string; bridgeId: string; name: string }): Promise<unknown>;
  getResources(): Promise<unknown>;
  activateScene(input: { id: string }): Promise<{ confirmed: boolean }>;
  setLight(input: HueLightChange): Promise<{ confirmed: boolean }>;
  disconnect(): Promise<void>;
}
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const object = (value: unknown): Record<string, any> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
export function parseSnapshot(input: unknown): HueSnapshot {
  const raw = object(input),
    bridge = object(raw.bridge);
  if (
    !Array.isArray(raw.errors) ||
    raw.errors.length > 0 ||
    !Array.isArray(raw.data) ||
    typeof bridge.id !== "string" ||
    typeof bridge.ip !== "string"
  )
    throw new Error("De Bridge gaf geen geldige apparaatlijst terug.");
  const resources = raw.data
    .map(object)
    .filter((r) => typeof r.id === "string" && uuid.test(r.id));
  const groups = new Map<string, string>();
  const deviceRooms = new Map<string, string>();
  const connectivity = new Map<string, string>();
  for (const r of resources) {
    if (r.type === "room" || r.type === "zone") {
      const name =
        typeof r.metadata?.name === "string" ? r.metadata.name : "Zonder kamer";
      groups.set(r.id, name);
      if (r.type === "room" && Array.isArray(r.children))
        for (const ref of r.children)
          if (ref?.rtype === "device" && typeof ref.rid === "string")
            deviceRooms.set(ref.rid, name);
    }
    if (
      r.type === "zigbee_connectivity" &&
      typeof r.owner?.rid === "string" &&
      typeof r.status === "string"
    )
      connectivity.set(r.owner.rid, r.status);
  }
  const lights: HueLight[] = resources
    .filter((r) => r.type === "light" && typeof r.on?.on === "boolean")
    .map((r) => {
      const schema = object(r.color_temperature?.mirek_schema);
      const brightness =
        typeof r.dimming?.brightness === "number" &&
        Number.isFinite(r.dimming.brightness)
          ? Math.max(0, Math.min(100, r.dimming.brightness))
          : 100;
      const minMirek = Math.max(
        153,
        Number.isFinite(schema.mirek_minimum) ? schema.mirek_minimum : 153,
      );
      const maxMirek = Math.min(
        500,
        Number.isFinite(schema.mirek_maximum) ? schema.mirek_maximum : 500,
      );
      return {
        id: r.id,
        name:
          typeof r.metadata?.name === "string" ? r.metadata.name : "Hue-lamp",
        room: deviceRooms.get(r.owner?.rid) || "Zonder kamer",
        on: r.on.on,
        brightness,
        reachable: !["disconnected", "connectivity_issue"].includes(
          connectivity.get(r.owner?.rid) || "",
        ),
        dimmable: Boolean(r.dimming),
        color: Boolean(r.color),
        temperature: Boolean(r.color_temperature),
        mirek:
          typeof r.color_temperature?.mirek === "number"
            ? r.color_temperature.mirek
            : null,
        minMirek,
        maxMirek,
      };
    });
  const scenes: HueScene[] = resources
    .filter((r) => r.type === "scene" && typeof r.metadata?.name === "string")
    .map((r) => ({
      id: r.id,
      name: r.metadata.name,
      room: groups.get(r.group?.rid) || "Zonder kamer",
      active: ["static", "dynamic_palette"].includes(r.status?.active),
    }));
  const compare = (
    a: { room: string; name: string },
    b: { room: string; name: string },
  ) => `${a.room} ${a.name}`.localeCompare(`${b.room} ${b.name}`, "nl");
  return {
    bridge: {
      ip: bridge.ip,
      id: bridge.id,
      name: typeof bridge.name === "string" ? bridge.name : "Hue Bridge",
    },
    lights: lights.sort(compare),
    scenes: scenes.sort(compare),
    updatedAt: Date.now(),
  };
}
export function colorToXy(hex: string): { x: number; y: number } {
  if (!/^#[0-9a-f]{6}$/i.test(hex))
    throw new Error("Kies een geldige lichtkleur.");
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
  });
  const X = r * 0.664511 + g * 0.154324 + b * 0.162028,
    Y = r * 0.283881 + g * 0.668433 + b * 0.047685,
    Z = r * 0.000088 + g * 0.07231 + b * 0.986039,
    sum = X + Y + Z;
  return sum > 0 ? { x: X / sum, y: Y / sum } : { x: 0.3127, y: 0.329 };
}
