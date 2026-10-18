export type Scene =
  | "Goedemorgen"
  | "Overdag"
  | "Avond"
  | "Filmavond"
  | "Welterusten"
  | "Alles uit";
export interface HomeState {
  name: string;
  lights: {
    living: boolean;
    kitchen: boolean;
    brightness: number;
    warmth: number;
  };
  shutter: number;
  target: number;
  music: { playing: boolean; track: number; volume: number };
  scene: Scene | null;
}
export const initialState: HomeState = {
  name: "Mijn Woning",
  lights: { living: true, kitchen: false, brightness: 68, warmth: 60 },
  shutter: 65,
  target: 21,
  music: { playing: false, track: 0, volume: 35 },
  scene: "Avond",
};
export const storageKey = "mijn-woning.home.v1";
export function loadState(): HomeState {
  try {
    const state: unknown = JSON.parse(
      localStorage.getItem(storageKey) || "null",
    );
    if (!state || typeof state !== "object") return initialState;
    const s = state as HomeState;
    const bounded = (n: unknown, min: number, max: number) =>
      typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
    if (
      typeof s.name !== "string" ||
      !s.name.trim() ||
      s.name.length > 40 ||
      typeof s.lights?.living !== "boolean" ||
      typeof s.lights?.kitchen !== "boolean" ||
      !bounded(s.lights.brightness, 1, 100) ||
      !bounded(s.lights.warmth, 0, 100) ||
      !bounded(s.shutter, 0, 100) ||
      !bounded(s.target, 15, 25) ||
      typeof s.music?.playing !== "boolean" ||
      !bounded(s.music.track, 0, 2) ||
      !Number.isInteger(s.music.track) ||
      !bounded(s.music.volume, 0, 100)
    )
      return initialState;
    return { ...s, music: { ...s.music, playing: false } };
  } catch {
    return initialState;
  }
}
