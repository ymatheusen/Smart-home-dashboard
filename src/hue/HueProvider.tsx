import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HueBridge, isNativeAndroid } from "./native";
import {
  isSceneIcon,
  loadSceneIcons,
  sceneIconsKey,
  type SceneIconId,
} from "./sceneIcons";
import {
  parseSnapshot,
  type HueSnapshot,
  type HueBridgeInfo,
  type HueLightChange,
} from "./model";
const modeKey = "mijn-woning.hue.live.v1",
  favoriteKey = "mijn-woning.hue.favorite-scenes.v1";
function loadFavorites(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
    return Array.isArray(ids)
      ? [...new Set(ids.filter((id): id is string => typeof id === "string"))]
      : [];
  } catch {
    return [];
  }
}
interface HueContextValue {
  native: boolean;
  live: boolean;
  paired: boolean;
  snapshot: HueSnapshot | null;
  error: string;
  busy: boolean;
  available: boolean;
  favorites: string[];
  icons: Record<string, SceneIconId>;
  setIcon(id: string, icon: SceneIconId): void;
  discover(): Promise<{ ip: string; name: string }[]>;
  inspect(ip: string): Promise<HueBridgeInfo>;
  pair(bridge: HueBridgeInfo): Promise<void>;
  refresh(): Promise<void>;
  setMode(live: boolean): void;
  disconnect(): Promise<void>;
  favorite(id: string): void;
  scene(id: string): Promise<void>;
  light(change: HueLightChange): Promise<void>;
}
const Context = createContext<HueContextValue | null>(null);
const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : typeof (error as { message?: unknown })?.message === "string"
      ? String((error as { message: string }).message)
      : "De Bridge is niet bereikbaar. Controleer of je op je thuisnetwerk zit.";
export function HueProvider({ children }: { children: ReactNode }) {
  const [icons, setIcons] = useState(loadSceneIcons);
  const [live, setLive] = useState(() => {
    try {
      return isNativeAndroid && localStorage.getItem(modeKey) === "true";
    } catch {
      return false;
    }
  });
  const [paired, setPaired] = useState(false),
    [snapshot, setSnapshot] = useState<HueSnapshot | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [available, setAvailable] = useState(false),
    [favorites, setFavorites] = useState(loadFavorites);
  const inFlight = useRef(false),
    mounted = useRef(true),
    currentLive = useRef(live),
    generation = useRef(0),
    readSequence = useRef(0);
  currentLive.current = live;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = async () => {
    if (!isNativeAndroid || inFlight.current) return;
    const turn = generation.current,
      request = ++readSequence.current;
    try {
      const next = parseSnapshot(await HueBridge.getResources());
      if (
        mounted.current &&
        turn === generation.current &&
        request === readSequence.current
      ) {
        setSnapshot(next);
        setAvailable(true);
        setPaired(true);
        setError("");
      }
    } catch (e) {
      if (
        mounted.current &&
        turn === generation.current &&
        request === readSequence.current
      ) {
        setAvailable(false);
        setError(errorMessage(e));
      }
    }
  };
  useEffect(() => {
    if (!isNativeAndroid) return;
    let active = true;
    void HueBridge.status()
      .then((status) => {
        if (!active) return;
        setPaired(status.paired);
        if (status.paired && currentLive.current) void refresh();
      })
      .catch(() => {
        if (active)
          setError(
            "De opgeslagen Hue-koppeling kon niet worden geopend. Koppel de Bridge opnieuw.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!live || !paired) return;
    void refresh();
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, 10000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [live, paired]);
  useEffect(() => {
    try {
      localStorage.setItem(modeKey, String(live));
      localStorage.setItem(favoriteKey, JSON.stringify(favorites));
    } catch {
      setError("Hue-voorkeuren konden niet worden opgeslagen.");
    }
  }, [live, favorites]);
  const run = async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (inFlight.current)
      throw new Error("Wacht tot de vorige Hue-opdracht klaar is.");
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      return await operation();
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
      throw new Error(message);
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const action = async (operation: () => Promise<{ confirmed: boolean }>) => {
    if (!live || !paired || !available)
      throw new Error(
        "Hue is niet live verbonden. Er is geen opdracht verstuurd.",
      );
    generation.current++;
    try {
      await run(async () => {
        const result = await operation();
        if (!result.confirmed)
          throw new Error("De Bridge heeft de opdracht niet bevestigd.");
      });
    } catch (e) {
      setAvailable(false);
      throw e;
    }
    await refresh();
  };
  const value: HueContextValue = {
    native: isNativeAndroid,
    live,
    paired,
    snapshot,
    error,
    busy,
    available,
    favorites,
    icons,
    setIcon: (id, icon) => {
      if (!snapshot?.scenes.some((s) => s.id === id) || !isSceneIcon(icon))
        return;
      const next = { ...icons, [id]: icon };
      try {
        localStorage.setItem(sceneIconsKey, JSON.stringify(next));
        setIcons(next);
      } catch {
        setError("Het scène-icoon kon niet worden opgeslagen.");
      }
    },
    discover: () => run(async () => (await HueBridge.discover()).bridges),
    inspect: (ip) => run(() => HueBridge.inspect({ ip })),
    pair: (bridge) =>
      run(async () => {
        const next = parseSnapshot(
          await HueBridge.pair({
            ip: bridge.ip,
            bridgeId: bridge.id,
            name: bridge.name,
          }),
        );
        setSnapshot(next);
        setPaired(true);
        setAvailable(true);
        setLive(true);
        setError("");
      }),
    refresh,
    setMode: (enabled) => {
      generation.current++;
      setLive(enabled && isNativeAndroid && paired);
      if (!enabled) {
        setAvailable(false);
        setError("");
      }
    },
    disconnect: () =>
      run(async () => {
        generation.current++;
        await HueBridge.disconnect();
        setLive(false);
        setPaired(false);
        setSnapshot(null);
        setAvailable(false);
        setFavorites([]);
      }),
    favorite: (id) =>
      setFavorites((ids) =>
        ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
      ),
    scene: (id) => action(() => HueBridge.activateScene({ id })),
    light: (change) => {
      const light = snapshot?.lights.find((l) => l.id === change.id);
      if (!light?.reachable)
        return Promise.reject(
          new Error(
            "Deze lamp is niet bereikbaar. Er is geen opdracht verstuurd.",
          ),
        );
      return action(() => HueBridge.setLight(change));
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useHue() {
  const value = useContext(Context);
  if (!value) throw new Error("HueProvider ontbreekt");
  return value;
}
