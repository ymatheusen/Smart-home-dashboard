import { namedDevice } from "./names";

export interface ShellyInfo {
  id: string;
  ip: string;
  name: string;
  profile?: "cover" | "switch";
}
export interface ShellyChannel {
  id: number;
  kind: "cover" | "switch";
  name: string;
  fault: boolean;
  state?: "open" | "closed" | "opening" | "closing" | "stopped" | "calibrating";
  calibrated?: boolean;
  position?: number | null;
  on?: boolean;
  power?: number;
}
export interface ShellyDevice extends ShellyInfo {
  profile: "cover" | "switch";
  channels: ShellyChannel[];
  available: boolean;
  error?: string;
}
export type ShellyAction =
  | "open"
  | "close"
  | "stop"
  | "position"
  | "on"
  | "off";
export interface ShellyCommand {
  id: string;
  channel: number;
  action: ShellyAction;
  position?: number;
}
export interface ShellyTransport {
  list(): Promise<{ devices: ShellyInfo[] }>;
  add(input: { ip: string; name: string; password: string }): Promise<unknown>;
  getDevice(input: { id: string }): Promise<unknown>;
  remove(input: { id: string }): Promise<void>;
  command(input: ShellyCommand): Promise<{ confirmed: boolean }>;
}
export function parseDevice(raw: unknown): ShellyDevice {
  if (!raw || typeof raw !== "object")
    throw Error("De Shelly gaf geen geldige status terug.");
  const d = raw as ShellyDevice;
  if (
    !/^shellyplus2pm-[a-f0-9]{12}$/.test(d.id) ||
    typeof d.ip !== "string" ||
    !["cover", "switch"].includes(d.profile) ||
    !Array.isArray(d.channels) ||
    d.available !== true ||
    d.channels.length !== (d.profile === "cover" ? 1 : 2)
  )
    throw Error("De Shelly gaf geen geldige apparaatlijst terug.");
  const ids = new Set<number>();
  for (const c of d.channels) {
    if (
      c.kind !== d.profile ||
      !Number.isInteger(c.id) ||
      c.id < 0 ||
      c.id > (d.profile === "cover" ? 0 : 1) ||
      ids.has(c.id) ||
      typeof c.fault !== "boolean"
    )
      throw Error("De Shelly gaf geen geldige kanalen terug.");
    ids.add(c.id);
    if (c.kind === "switch" && typeof c.on !== "boolean")
      throw Error("De lampstatus ontbreekt.");
    if (
      c.kind === "cover" &&
      (!c.state ||
        ![
          "open",
          "closed",
          "opening",
          "closing",
          "stopped",
          "calibrating",
        ].includes(c.state) ||
        typeof c.calibrated !== "boolean" ||
        (c.position !== null &&
          (!Number.isFinite(c.position) ||
            Number(c.position) < 0 ||
            Number(c.position) > 100)) ||
        (!c.calibrated && c.position !== null))
    )
      throw Error("De rolluikstatus ontbreekt.");
  }
  return namedDevice(d, {});
}
export const coverState = (state?: string) =>
  ({
    open: "Geopend",
    closed: "Gesloten",
    opening: "Opent…",
    closing: "Sluit…",
    stopped: "Gestopt",
    calibrating: "Kalibratie via Shelly",
  })[state || ""] || "Stand onbekend";
