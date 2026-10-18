export type WidgetId =
  "light" | "climate" | "shutter" | "music" | "camera" | "kitchen";
export type Density = "roomy" | "normal" | "compact";
export type Profile = "phone" | "tablet";
export interface LayoutProfile {
  density: Density;
  order: WidgetId[];
  hidden: WidgetId[];
}
export type LayoutSettings = Record<Profile, LayoutProfile>;
export const widgetNames: Record<WidgetId, string> = {
  light: "Verlichting",
  climate: "Klimaat",
  shutter: "Rolluik",
  music: "Muziek",
  camera: "Voordeur",
  kitchen: "Keuken",
};
export const widgetIds: WidgetId[] = [
  "light",
  "climate",
  "shutter",
  "music",
  "camera",
  "kitchen",
];
export const layoutStorageKey = "mijn-woning.layout.v1";
export function defaultProfile(): LayoutProfile {
  return {
    density: "normal",
    order: [...widgetIds],
    hidden: ["camera", "kitchen"],
  };
}
export function loadLayout(): LayoutSettings {
  const defaults = { phone: defaultProfile(), tablet: defaultProfile() };
  try {
    const parsed = JSON.parse(localStorage.getItem(layoutStorageKey) || "null");
    for (const key of ["phone", "tablet"] as const) {
      const p = parsed?.[key];
      if (
        p &&
        ["roomy", "normal", "compact"].includes(p.density) &&
        Array.isArray(p.order) &&
        p.order.length === widgetIds.length &&
        new Set(p.order).size === widgetIds.length &&
        p.order.every((id: WidgetId) => widgetIds.includes(id)) &&
        Array.isArray(p.hidden) &&
        p.hidden.every((id: WidgetId) => widgetIds.includes(id))
      )
        defaults[key] = {
          density: p.density,
          order: p.order,
          hidden: [...new Set<WidgetId>(p.hidden)],
        };
    }
  } catch {
    /* Keep usable defaults when storage is unavailable or malformed. */
  }
  return defaults;
}
