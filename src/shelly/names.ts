import type { ShellyDevice } from "./model";

export const namesKey = "mijn-woning.shelly.names.v1";
export type ShellyNames = Record<
  string,
  { name?: string; channels?: Record<string, string> }
>;
export function cleanName(value: unknown): string {
  if (typeof value !== "string") return "";
  const name = value.trim();
  return name && name.length <= 60 && !/^(null|undefined)$/i.test(name)
    ? name
    : "";
}
export function loadNames(): ShellyNames {
  try {
    const raw = JSON.parse(localStorage.getItem(namesKey) || "{}");
    const names: ShellyNames = {};
    for (const [id, value] of Object.entries(raw || {})) {
      if (
        !/^shellyplus2pm-[a-f0-9]{12}$/.test(id) ||
        !value ||
        typeof value !== "object"
      )
        continue;
      const entry = value as ShellyNames[string];
      names[id] = { name: cleanName(entry.name), channels: {} };
      for (const channel of ["0", "1"])
        if (cleanName(entry.channels?.[channel]))
          names[id].channels![channel] = cleanName(entry.channels?.[channel]);
    }
    return names;
  } catch {
    return {};
  }
}
export function namedDevice(
  device: ShellyDevice,
  names: ShellyNames,
): ShellyDevice {
  const saved = names[device.id];
  const name =
    cleanName(saved?.name) || cleanName(device.name) || `Shelly · ${device.ip}`;
  return {
    ...device,
    name,
    channels: device.channels.map((c) => ({
      ...c,
      name:
        cleanName(saved?.channels?.[c.id]) ||
        (c.kind === "cover" && cleanName(saved?.name)
          ? name
          : cleanName(c.name) ||
            (c.kind === "cover" ? name : `${name} · lamp ${c.id + 1}`)),
    })),
  };
}
