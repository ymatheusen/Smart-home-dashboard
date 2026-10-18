import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { registerPlugin } from "@capacitor/core";
import { isNativeAndroid } from "../hue/native";
import { cleanName, loadNames, namedDevice, namesKey } from "./names";
import {
  parseDevice,
  type ShellyDevice,
  type ShellyInfo,
  type ShellyTransport,
  type ShellyCommand,
} from "./model";

const Shelly = registerPlugin<ShellyTransport>("Shelly"),
  modeKey = "mijn-woning.shelly.live.v1";
const message = (e: unknown) =>
  typeof (e as Error)?.message === "string"
    ? (e as Error).message
    : "De Shelly is niet bereikbaar. Controleer je thuisnetwerk.";
interface Value {
  native: boolean;
  live: boolean;
  devices: ShellyDevice[];
  busy: boolean;
  pending: string[];
  error: string;
  add(ip: string, name: string, password: string): Promise<void>;
  remove(id: string): Promise<void>;
  rename(id: string, name: string, channel?: number): void;
  refresh(): Promise<void>;
  setMode(live: boolean): void;
  command(input: ShellyCommand): Promise<void>;
}
const Context = createContext<Value | null>(null);
export function ShellyProvider({ children }: { children: ReactNode }) {
  const [names, setNames] = useState(loadNames);
  const [live, setLive] = useState(() => {
    try {
      return isNativeAndroid && localStorage.getItem(modeKey) === "true";
    } catch {
      return false;
    }
  });
  const [devices, setDevices] = useState<ShellyDevice[]>([]),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<string[]>([]),
    [error, setError] = useState("");
  const records = useRef(devices),
    liveRef = useRef(live),
    reads = useRef(new Map<string, number>()),
    activeCommands = useRef(new Map<string, number>()),
    reading = useRef(new Set<string>()),
    changing = useRef(false),
    mounted = useRef(true);
  records.current = devices;
  liveRef.current = live;
  const invalidate = (id: string) => {
    const next = (reads.current.get(id) || 0) + 1;
    reads.current.set(id, next);
    return next;
  };
  const update = (id: string, fn: (device: ShellyDevice) => ShellyDevice) => {
    if (mounted.current)
      setDevices((list) => list.map((d) => (d.id === id ? fn(d) : d)));
  };
  const refreshOne = async (id: string) => {
    if (reading.current.has(id) || activeCommands.current.has(id)) return;
    reading.current.add(id);
    const turn = invalidate(id);
    try {
      const next = parseDevice(await Shelly.getDevice({ id }));
      if (next.id !== id)
        throw Error("De apparaatidentiteit komt niet overeen.");
      if (reads.current.get(id) === turn) update(id, () => next);
    } catch (e) {
      if (reads.current.get(id) === turn)
        update(id, (d) => ({ ...d, available: false, error: message(e) }));
    } finally {
      reading.current.delete(id);
    }
  };
  const refresh = async () => {
    if (isNativeAndroid)
      await Promise.all(records.current.map((d) => refreshOne(d.id)));
  };
  useEffect(() => {
    mounted.current = true;
    if (!isNativeAndroid)
      return () => {
        mounted.current = false;
      };
    let valid = true;
    void Shelly.list()
      .then(({ devices: saved }) => {
        if (!valid || !Array.isArray(saved)) return;
        const metadata: ShellyDevice[] = saved
          .filter((d: ShellyInfo) => /^shellyplus2pm-[a-f0-9]{12}$/.test(d.id))
          .map((d) => ({
            ...d,
            profile: d.profile === "cover" ? "cover" : "switch",
            channels: [],
            available: false,
          }));
        records.current = metadata;
        setDevices(metadata);
        if (liveRef.current) void refresh();
      })
      .catch((e) => {
        if (valid) setError(message(e));
      });
    return () => {
      valid = false;
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(modeKey, String(live));
    } catch {
      setError("De Shelly-voorkeur kon niet worden opgeslagen.");
    }
  }, [live]);
  useEffect(() => {
    if (!live) return;
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    tick();
    const timer = window.setInterval(tick, 3000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [live]);
  const settings = async (fn: () => Promise<void>) => {
    if (changing.current || activeCommands.current.size)
      throw Error("Wacht tot de vorige Shelly-opdracht klaar is.");
    changing.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(message(e));
      throw Error(message(e));
    } finally {
      changing.current = false;
      setBusy(false);
    }
  };
  const value: Value = {
    native: isNativeAndroid,
    live,
    devices: devices.map((d) => namedDevice(d, names)),
    busy,
    pending,
    error,
    refresh,
    rename: (id, name, channel) => {
      const device = records.current.find((d) => d.id === id);
      const cleaned = cleanName(name);
      if (
        !device ||
        !cleaned ||
        (channel !== undefined &&
          !device.channels.some((c) => c.id === channel))
      )
        throw Error("Kies een geldige naam van maximaal 60 tekens.");
      const next = {
        ...names,
        [id]:
          channel === undefined
            ? { ...names[id], name: cleaned }
            : {
                ...names[id],
                channels: { ...names[id]?.channels, [channel]: cleaned },
              },
      };
      try {
        localStorage.setItem(namesKey, JSON.stringify(next));
      } catch {
        throw Error("De naam kon niet worden opgeslagen.");
      }
      setNames(next);
    },
    add: (ip, name, password) =>
      settings(async () => {
        const next = parseDevice(await Shelly.add({ ip, name, password }));
        invalidate(next.id);
        setDevices((list) => [...list.filter((d) => d.id !== next.id), next]);
        setLive(true);
      }),
    remove: (id) =>
      settings(async () => {
        invalidate(id);
        await Shelly.remove({ id });
        setDevices((list) => list.filter((d) => d.id !== id));
      }),
    setMode: (enabled) => {
      for (const device of records.current) invalidate(device.id);
      setLive(enabled && isNativeAndroid && records.current.length > 0);
      setDevices((list) => list.map((d) => ({ ...d, available: false })));
      setError("");
    },
    command: async (input) => {
      const device = records.current.find((d) => d.id === input.id),
        channel = device?.channels.find((c) => c.id === input.channel);
      if (
        !liveRef.current ||
        !device ||
        changing.current ||
        (!device.available && input.action !== "stop")
      )
        throw Error(
          "Shelly is niet live bereikbaar. Er is geen opdracht verstuurd.",
        );
      if (!channel || (channel.fault && input.action !== "stop"))
        throw Error("Controleer dit kanaal in de Shelly-app.");
      if (activeCommands.current.has(input.id) && input.action !== "stop")
        throw Error("Wacht tot de vorige opdracht bevestigd is.");
      invalidate(input.id);
      activeCommands.current.set(
        input.id,
        (activeCommands.current.get(input.id) || 0) + 1,
      );
      setPending([...activeCommands.current.keys()]);
      try {
        const result = await Shelly.command(input);
        if (!result.confirmed)
          throw Error("De Shelly heeft de opdracht niet bevestigd.");
      } catch (e) {
        update(input.id, (d) => ({
          ...d,
          available: false,
          error: message(e),
        }));
        throw Error(message(e));
      } finally {
        const count = (activeCommands.current.get(input.id) || 1) - 1;
        if (count) activeCommands.current.set(input.id, count);
        else activeCommands.current.delete(input.id);
        setPending([...activeCommands.current.keys()]);
      }
      // Never infer physical state from an acknowledgement. Read it from the device.
      await refreshOne(input.id);
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useShelly() {
  const context = useContext(Context);
  if (!context) throw Error("ShellyProvider ontbreekt");
  return context;
}
