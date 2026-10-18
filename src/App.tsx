import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Blinds,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Coffee,
  DoorOpen,
  Expand,
  Gauge,
  Home,
  LampDesk,
  Leaf,
  Lightbulb,
  Minus,
  Moon,
  Music2,
  Pause,
  Play,
  Plus,
  Power,
  Settings2,
  ShieldCheck,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Square,
  Sunset,
  Sun,
  Thermometer,
  Wifi,
  X,
} from "lucide-react";
import { initialState, loadState, storageKey, type Scene } from "./model";
import {
  loadLayout,
  layoutStorageKey,
  widgetNames,
  widgetIds,
  type Profile,
  type WidgetId,
} from "./layout";
import { tracks } from "./tracks";
import { CameraArt, Switch } from "./components/DevicePrimitives";
import { DeviceControls } from "./components/DeviceControls";
import { LayoutEditor } from "./components/LayoutEditor";
import { PwaControls, PwaUpdateNotice } from "./pwa/PwaControls";
import { usePwa } from "./pwa/PwaProvider";
import { useHue } from "./hue/HueProvider";
import { useShelly } from "./shelly/ShellyProvider";
import {
  ShellySetup,
  ShellyDevices,
  ShellyHomeTile,
} from "./shelly/ShellyControls";
import { HueSetup, HueHomeScenes, HueLights } from "./hue/HueControls";
const pages = [
  {
    id: "home",
    label: "Home",
    heading: "Welkom thuis",
    description: "",
    icon: Home,
  },
  {
    id: "rooms",
    label: "Kamers",
    heading: "Ruimte om te leven",
    description: "Je apparaten, precies binnen handbereik.",
    icon: LampDesk,
  },
  {
    id: "climate",
    label: "Klimaat",
    heading: "Een aangenaam thuis",
    description: "Comfort in huis, op jouw temperatuur.",
    icon: Thermometer,
  },
  {
    id: "camera",
    label: "Camera",
    heading: "Een oogje in het zeil",
    description: "Je voordeur, rustig in beeld.",
    icon: ShieldCheck,
  },
  {
    id: "tech",
    label: "Techniek",
    heading: "Achter de schermen",
    description: "Een helder overzicht van je woning.",
    icon: SlidersHorizontal,
  },
] as const;
type PageId = (typeof pages)[number]["id"];
type Modal = WidgetId | "settings" | "notifications" | "system" | null;
function readPage(): PageId {
  const hash = window.location.hash.slice(1);
  return pages.find((p) => p.id === hash)?.id || "home";
}
const sceneList = [
  { name: "Goedemorgen", icon: Coffee },
  { name: "Overdag", icon: Sun },
  { name: "Avond", icon: Sunset },
  { name: "Filmavond", icon: Play },
  { name: "Welterusten", icon: Moon },
  { name: "Alles uit", icon: Power },
] as const;
export default function App() {
  const { online } = usePwa();
  const hue = useHue();
  const shelly = useShelly();
  const realLights = hue.live || shelly.live;
  const localSummary = [
    hue.live ? `Hue ${hue.available ? "live" : "niet bereikbaar"}` : "",
    shelly.live
      ? `Shelly ${shelly.devices.filter((d) => d.available).length}/${shelly.devices.length}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const [state, setState] = useState(loadState);
  const [layout, setLayout] = useState(loadLayout);
  const [layoutError, setLayoutError] = useState(false);
  const [profile, setProfile] = useState<Profile>(() =>
    window.innerWidth < 700 ? "phone" : "tablet",
  );
  const [page, setPage] = useState<PageId>(readPage);
  const [tilePage, setTilePage] = useState(0);
  const [capacity, setCapacity] = useState(4);
  const [pressureLow, setPressureLow] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const update = () =>
      setProfile(window.innerWidth < 700 ? "phone" : "tablet");
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  useEffect(() => {
    const update = () => {
      setPage(readPage());
      setTilePage(0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(layoutStorageKey, JSON.stringify(layout));
      setLayoutError(false);
    } catch {
      setLayoutError(true);
    }
  }, [layout]);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 12;
      const tileHeight =
        layout[profile].density === "roomy"
          ? 174
          : layout[profile].density === "compact"
            ? 118
            : 146;
      setCapacity(
        Math.min(
          6,
          Math.max(
            2,
            Math.floor((grid.clientHeight + gap) / (tileHeight + gap)) * 2,
          ),
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [page, profile, layout[profile].density]);

  const [now, setNow] = useState(new Date());
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [shutterTarget, setShutterTarget] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [doorbell, setDoorbell] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const track = tracks[state.music.track];
  const activeLights =
    Number(state.lights.living) + Number(state.lights.kitchen);
  const notify = (message: string) => setToast(message);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (shutterTarget === null) return;
    const id = setInterval(
      () =>
        setState((s) => ({
          ...s,
          shutter:
            s.shutter < shutterTarget
              ? Math.min(s.shutter + 1, shutterTarget)
              : Math.max(s.shutter - 1, shutterTarget),
        })),
      70,
    );
    return () => clearInterval(id);
  }, [shutterTarget]);
  useEffect(() => {
    if (shutterTarget === state.shutter) setShutterTarget(null);
  }, [state.shutter, shutterTarget]);
  useEffect(() => {
    if (!state.music.playing) return;
    const id = setInterval(
      () => setElapsed((e) => (e + 1) % track.duration),
      1000,
    );
    return () => clearInterval(id);
  }, [state.music.playing, track.duration]);
  useEffect(() => {
    if (modal) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [modal]);
  useEffect(() => {
    if (!doorbell) return;
    const deadline = Date.now() + 45_000;
    const id = setInterval(
      () =>
        setCountdown(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      1000,
    );
    return () => clearInterval(id);
  }, [doorbell]);
  useEffect(() => {
    if (doorbell && countdown === 0) {
      setModal(null);
      setDoorbell(false);
    }
  }, [countdown, doorbell]);
  const closeModal = () => {
    setModal(null);
    setDoorbell(false);
  };
  const ringDoorbell = () => {
    setCountdown(45);
    setDoorbell(true);
    setModal("camera");
  };
  const changeTrack = (direction: number) => {
    setState((s) => ({
      ...s,
      music: {
        ...s.music,
        track: (s.music.track + direction + tracks.length) % tracks.length,
      },
    }));
    setElapsed(0);
  };
  const applyScene = (scene: Scene) => {
    const night = scene === "Welterusten" || scene === "Alles uit";
    const brightness = scene === "Filmavond" ? 20 : scene === "Avond" ? 68 : 90;
    setShutterTarget(null);
    setState((s) => ({
      ...s,
      scene,
      lights: {
        ...s.lights,
        living: !night,
        kitchen: scene === "Goedemorgen" || scene === "Overdag",
        brightness,
      },
      shutter:
        scene === "Overdag" || scene === "Goedemorgen"
          ? 100
          : scene === "Alles uit"
            ? s.shutter
            : 0,
      music: { ...s.music, playing: night ? false : s.music.playing },
    }));
    notify(`Scène ‘${scene}’ geactiveerd · demo`);
  };

  const visibleWidgets = layout[profile].order.filter(
    (id) => !layout[profile].hidden.includes(id),
  );
  const displayedWidgets = page === "rooms" ? widgetIds : visibleWidgets;
  const pageCount = Math.max(1, Math.ceil(displayedWidgets.length / capacity));
  const safeTilePage = Math.min(tilePage, pageCount - 1);
  const tileIds = displayedWidgets.slice(
    safeTilePage * capacity,
    (safeTilePage + 1) * capacity,
  );
  const controlProps = {
    state,
    setState,
    shutterTarget,
    setShutterTarget,
    elapsed,
    setElapsed,
    changeTrack,
  };
  const navigate = (next: PageId) => {
    setPage(next);
    setTilePage(0);
    window.location.hash = next;
  };
  const pressure = pressureLow ? "0,7" : "1,2";
  const icons = {
    light: Lightbulb,
    climate: Thermometer,
    shutter: Blinds,
    music: Music2,
    camera: DoorOpen,
    kitchen: LampDesk,
  };
  const tile = (id: WidgetId) => {
    if (shelly.live && id === "shutter")
      return (
        <ShellyHomeTile
          key={id}
          onOpen={() => setModal("shutter")}
          onMessage={notify}
        />
      );
    if (realLights && (id === "light" || id === "kitchen")) {
      const lights = hue.live ? hue.snapshot?.lights || [] : [];
      const shellyLights = shelly.live
        ? shelly.devices.flatMap((d) =>
            d.channels
              .filter((c) => c.kind === "switch")
              .map((c) => ({ ...c, available: d.available })),
          )
        : [];
      const available =
        (hue.live && hue.available) || shellyLights.some((c) => c.available);
      return (
        <article className="home-tile tile-light" key={id}>
          <button
            className="tile-open"
            aria-label={`${widgetNames[id]} bedienen`}
            onClick={() => setModal(id)}
          >
            <span className="device-icon">
              <Lightbulb size={21} />
            </span>
            <span>
              {id === "light" ? "Verlichting" : "Alle lampen"}
              <small>
                {[hue.live ? "Hue" : "", shelly.live ? "Shelly" : ""]
                  .filter(Boolean)
                  .join(" & ")}{" "}
                · lokaal
              </small>
            </span>
            <ArrowUpRight size={16} />
          </button>
          <div className="tile-value">
            <strong>
              {available
                ? (hue.available
                    ? lights.filter((l) => l.on && l.reachable).length
                    : 0) +
                  shellyLights.filter((c) => c.available && c.on).length
                : "–"}
              <small> / {lights.length + shellyLights.length}</small>
            </strong>
            <span>
              {available
                ? "Lampen aan · bereikbare modules"
                : "Stand niet actueel"}
            </span>
          </div>
          <div className="tile-actions">
            <button className="tile-text-action" onClick={() => setModal(id)}>
              Lampen bedienen <ChevronRight size={15} />
            </button>
          </div>
        </article>
      );
    }

    const Icon = icons[id];
    return (
      <article className={`home-tile tile-${id}`} key={id}>
        <button
          className="tile-open"
          aria-label={`${widgetNames[id]} bedienen`}
          onClick={() => setModal(id)}
        >
          <span className="device-icon">
            <Icon size={21} strokeWidth={1.5} />
          </span>
          <span>
            {widgetNames[id]}
            <small>
              {id === "kitchen"
                ? "Keuken"
                : id === "camera"
                  ? "Eufy · demo"
                  : "Woonkamer"}
            </small>
          </span>
          <ArrowUpRight size={16} />
        </button>
        <div className="tile-value">
          {id === "light" ? (
            <>
              <strong>
                {state.lights.living ? state.lights.brightness : 0}
                <small>%</small>
              </strong>
              <span>
                {state.lights.living ? "Warm & gezellig" : "Verlichting uit"}
              </span>
            </>
          ) : id === "climate" ? (
            <>
              <strong>
                20,5<small>°</small>
              </strong>
              <span>Doel {state.target.toLocaleString("nl-NL")}°</span>
            </>
          ) : id === "shutter" ? (
            <>
              <strong>
                {state.shutter}
                <small>%</small>
              </strong>
              <span>{shutterTarget === null ? "Geopend" : "In beweging…"}</span>
            </>
          ) : id === "music" ? (
            <>
              <strong className="track-title">{track.title}</strong>
              <span>{track.artist} · demo</span>
            </>
          ) : id === "camera" ? (
            <>
              <strong className="text-value">Alles rustig</strong>
              <span>Voorbeeld · geen livebeeld</span>
            </>
          ) : (
            <>
              <strong className="text-value">
                {state.lights.kitchen ? "Licht aan" : "Licht uit"}
              </strong>
              <span>Philips Hue · demo</span>
            </>
          )}
        </div>
        <div className="tile-actions">
          {id === "light" && (
            <>
              <span>{state.lights.living ? "Aan" : "Uit"}</span>
              <Switch
                label="Woonkamerverlichting"
                on={state.lights.living}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    scene: null,
                    lights: { ...s.lights, living: !s.lights.living },
                  }))
                }
              />
            </>
          )}
          {id === "kitchen" && (
            <>
              <span>Warm wit</span>
              <Switch
                label="Keukenverlichting"
                on={state.lights.kitchen}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    scene: null,
                    lights: { ...s.lights, kitchen: !s.lights.kitchen },
                  }))
                }
              />
            </>
          )}
          {id === "climate" && (
            <>
              <button
                className="tile-control"
                aria-label="Temperatuur verlagen"
                disabled={state.target <= 15}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    target: Math.max(15, s.target - 0.5),
                  }))
                }
              >
                <Minus size={17} />
              </button>
              <span>{state.target > 20.5 ? "Verwarmt" : "Op temperatuur"}</span>
              <button
                className="tile-control"
                aria-label="Temperatuur verhogen"
                disabled={state.target >= 25}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    target: Math.min(25, s.target + 0.5),
                  }))
                }
              >
                <Plus size={17} />
              </button>
            </>
          )}
          {id === "shutter" && (
            <>
              <button
                className="tile-control"
                aria-label="Rolluik openen"
                onClick={() => setShutterTarget(100)}
              >
                <ArrowUp size={17} />
              </button>
              <button
                className="tile-control"
                aria-label="Rolluik stoppen"
                onClick={() => setShutterTarget(null)}
              >
                <Square size={12} />
              </button>
              <button
                className="tile-control"
                aria-label="Rolluik sluiten"
                onClick={() => setShutterTarget(0)}
              >
                <ArrowDown size={17} />
              </button>
            </>
          )}
          {id === "music" && (
            <>
              <button
                className="tile-control"
                aria-label="Vorig nummer"
                onClick={() => changeTrack(-1)}
              >
                <SkipBack size={16} />
              </button>
              <button
                className="tile-control play-quick"
                aria-label={
                  state.music.playing ? "Muziek pauzeren" : "Muziek afspelen"
                }
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    music: { ...s.music, playing: !s.music.playing },
                  }))
                }
              >
                {state.music.playing ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <button
                className="tile-control"
                aria-label="Volgend nummer"
                onClick={() => changeTrack(1)}
              >
                <SkipForward size={16} />
              </button>
            </>
          )}
          {id === "camera" && (
            <button className="tile-text-action" onClick={ringDoorbell}>
              <Bell size={15} /> Test deurbel
            </button>
          )}
        </div>
      </article>
    );
  };
  const pager = (
    <div className="tile-pagination">
      <button
        className="icon-button"
        aria-label="Vorige tegelpagina"
        disabled={safeTilePage === 0}
        onClick={() => setTilePage(safeTilePage - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <span>
        {pageCount > 1
          ? `Tegels ${safeTilePage + 1} / ${pageCount}`
          : "Alles in één oogopslag"}
      </span>
      <button
        className="icon-button"
        aria-label="Volgende tegelpagina"
        disabled={safeTilePage >= pageCount - 1}
        onClick={() => setTilePage(safeTilePage + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    <div
      className={`app-shell dashboard-shell density-${layout[profile].density}`}
      data-profile={profile}
    >
      <header className="topbar">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
          className="brand"
          aria-label="Mijn Woning, Home"
        >
          <span className="brand-mark">
            <Home size={21} strokeWidth={1.5} />
          </span>
          <span>
            {state.name}
            <small>JOUW HUIS, IN HARMONIE</small>
          </span>
        </a>
        <div className="header-actions">
          <span className="connection">
            <span />{" "}
            {localSummary
              ? `${localSummary} · rest demo`
              : online
                ? "Demo actief"
                : "Offline · demo"}
          </span>
          <button
            className="icon-button notification-button"
            aria-label="Meldingen"
            onClick={() => setModal("notifications")}
          >
            <Bell size={20} />
            {(!notificationsRead || pressureLow) && <i />}
          </button>
          <button
            className="icon-button"
            aria-label="Instellingen"
            onClick={() => setModal("settings")}
          >
            <Settings2 size={20} />
          </button>
        </div>
      </header>
      <main
        className="dashboard-main"
        id="home"
        onPointerDown={(e) => {
          swipeStart.current =
            e.target instanceof Element &&
            !e.target.closest("button, input, a, select")
              ? { x: e.clientX, y: e.clientY }
              : null;
        }}
        onPointerUp={(e) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start || modal) return;
          const dx = e.clientX - start.x,
            dy = e.clientY - start.y;
          if (Math.abs(dx) > 70 && Math.abs(dy) < 45) {
            const next =
              pages.findIndex((p) => p.id === page) + (dx < 0 ? 1 : -1);
            if (next >= 0 && next < pages.length) navigate(pages[next].id);
          }
        }}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        {page === "home" ? (
          <section className="home-content" aria-label="Home-overzicht">
            <div className="home-greeting">
              <div>
                <span className="eyebrow">JOUW HUIS, IN HARMONIE</span>
                <h1>
                  Welkom thuis<span>.</span>
                </h1>
                <p>
                  {now.toLocaleDateString("nl-NL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <div className="home-clock">
                {now.toLocaleTimeString("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <span>
                  <CloudSun size={18} />
                  16° <small>Demo</small>
                </span>
              </div>
            </div>
            {hue.live ? (
              <HueHomeScenes
                onSetup={() => setModal("settings")}
                onMessage={notify}
              />
            ) : (
              <section className="home-scenes" aria-label="Snelle scènes">
                <div className="compact-heading">
                  <h2>De juiste sfeer</h2>
                  <span>{state.scene || "Maak het je eigen"}</span>
                </div>
                <div className="scenes">
                  {sceneList.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      className={`scene ${state.scene === name ? "active" : ""}`}
                      aria-pressed={state.scene === name}
                      onClick={() => applyScene(name)}
                    >
                      <Icon size={21} strokeWidth={1.4} />
                      <span>{name}</span>
                      {state.scene === name && (
                        <i className="scene-indicator" />
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="tile-section" aria-label="Favoriete apparaten">
              <div className="compact-heading">
                <h2>Binnen handbereik</h2>
                <button
                  className="text-button"
                  onClick={() => setModal("settings")}
                >
                  <SlidersHorizontal size={13} /> Indeling
                </button>
              </div>
              <div
                className="home-tile-grid"
                ref={gridRef}
                style={{
                  gridTemplateRows: `repeat(${Math.ceil(tileIds.length / 2) || 1}, minmax(0, 1fr))`,
                }}
              >
                {tileIds.length ? (
                  tileIds.map(tile)
                ) : (
                  <div className="empty-home">
                    <Leaf size={28} />
                    <p>Een rustig begin.</p>
                    <button
                      className="text-button"
                      onClick={() => setModal("settings")}
                    >
                      Kies je Home-tegels
                    </button>
                  </div>
                )}
              </div>
              {pager}
            </section>
          </section>
        ) : (
          <section
            className={`section-content page-${page}`}
            aria-label={pages.find((p) => p.id === page)?.label}
          >
            <div className="screen-title">
              <div>
                <span className="eyebrow">
                  {localSummary
                    ? "LOKAAL VERBONDEN · OVERIGE DEMO"
                    : "MIJN WONING · DEMO"}
                </span>
                <h1>{pages.find((p) => p.id === page)?.heading}</h1>
                <p>{pages.find((p) => p.id === page)?.description}</p>
              </div>
              {page === "rooms" && (
                <span className="room-badge">
                  {localSummary ? "Alle apparaten" : "Woonkamer & keuken"}
                </span>
              )}
            </div>
            {page === "rooms" && (
              <section
                className="tile-section"
                aria-label="Apparaten per kamer"
              >
                <div
                  className="home-tile-grid"
                  ref={gridRef}
                  style={{
                    gridTemplateRows: `repeat(${Math.ceil(tileIds.length / 2) || 1}, minmax(0, 1fr))`,
                  }}
                >
                  {tileIds.map(tile)}
                </div>
                {pager}
              </section>
            )}
            {page === "climate" && (
              <div className="climate-stage">
                <DeviceControls device="climate" {...controlProps} />
                <button
                  className={`boiler-summary ${pressureLow ? "has-warning" : ""}`}
                  onClick={() => setModal("system")}
                >
                  <span className="device-icon">
                    <Gauge size={22} />
                  </span>
                  <span>
                    Je cv-ketel
                    <small>
                      {pressureLow
                        ? "Lage waterdruk · simulatie"
                        : "Voorbeeldstatus normaal"}
                    </small>
                  </span>
                  <strong>
                    {pressure} <small>bar</small>
                  </strong>
                  <ChevronRight size={16} />
                </button>
                <p className="screen-note">
                  Alle temperaturen en ketelwaarden zijn demogegevens.
                </p>
              </div>
            )}
            {page === "camera" && (
              <div className="camera-stage">
                <button
                  className="camera-large"
                  aria-label="Voorbeeld voordeur vergroten"
                  onClick={() => setModal("camera")}
                >
                  <CameraArt />
                  <span className="camera-overlay">
                    <span>
                      <span className="status-dot" />
                      Voordeur · voorbeeld
                    </span>
                    <Expand size={20} />
                  </span>
                </button>
                <div className="camera-status">
                  <ShieldCheck size={19} />
                  <div>
                    <strong>Een rustig gevoel</strong>
                    <p>Geïllustreerd voorbeeld, geen liveverbinding.</p>
                  </div>
                </div>
                <button className="primary-button" onClick={ringDoorbell}>
                  <Bell size={18} /> Simuleer aanbellen
                </button>
              </div>
            )}
            {page === "tech" && (
              <div className="tech-stage">
                <div className="system-overview">
                  <span
                    className={pressureLow ? "warning-dot" : "status-dot"}
                  />
                  <strong>
                    {pressureLow
                      ? "1 voorbeeldwaarschuwing"
                      : "Je woning in balans"}
                  </strong>
                  <span>Demomodus</span>
                </div>
                <div className="integration-list">
                  {[
                    {
                      title: "Philips Hue",
                      sub: hue.live
                        ? `${hue.snapshot?.lights.length || 0} Hue-lampen · ${hue.available ? "live" : "niet bereikbaar"}`
                        : `${activeLights} van 2 lampen aan`,
                      icon: Lightbulb,
                    },
                    {
                      title: "Shelly",
                      sub: shelly.live
                        ? `${shelly.devices.filter((d) => d.available).length} van ${shelly.devices.length} modules bereikbaar`
                        : `Rolluik ${state.shutter}% geopend · demo`,
                      icon: Blinds,
                    },
                    {
                      title: "Remeha",
                      sub: `Waterdruk ${pressure} bar`,
                      icon: Thermometer,
                    },
                    {
                      title: "Eufy",
                      sub: "HomeBase & deurbel · voorbeeld",
                      icon: ShieldCheck,
                    },
                  ].map(({ title, sub, icon: Icon }) => (
                    <button
                      key={title}
                      className="integration-row"
                      onClick={() => setModal("system")}
                    >
                      <span className="device-icon">
                        <Icon size={20} />
                      </span>
                      <span>
                        <strong>{title}</strong>
                        <small>{sub}</small>
                      </span>
                      <span className="tiny-label">
                        {(title === "Philips Hue" && hue.live) ||
                        (title === "Shelly" && shelly.live)
                          ? "LOKAAL"
                          : "DEMO"}
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
                <button
                  className="warning-test"
                  onClick={() => {
                    setPressureLow((v) => !v);
                    notify(
                      pressureLow
                        ? "Voorbeelddruk hersteld"
                        : "Lage waterdruk gesimuleerd",
                    );
                  }}
                >
                  {pressureLow ? <Check size={17} /> : <Gauge size={17} />}{" "}
                  {pressureLow
                    ? "Herstel voorbeeldwaterdruk"
                    : "Simuleer lage waterdruk"}
                </button>
              </div>
            )}
          </section>
        )}
        <div className="screen-bottom">
          <span>
            {storageError || layoutError
              ? "Opslaan niet gelukt · controleer browseropslag"
              : localSummary
                ? `${localSummary} · overige apparaten demo`
                : pressureLow
                  ? "Lage waterdruk · demowaarschuwing"
                  : !online
                    ? "Offline · je demobediening blijft beschikbaar"
                    : "Alles is demo · geen echte apparatenacties"}
          </span>
          <span className="swipe-hint">
            <ChevronLeft size={11} /> Swipe of kies een scherm{" "}
            <ChevronRight size={11} />
          </span>
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Hoofdnavigatie">
        {pages.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? "selected" : ""}`}
            aria-current={page === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <Icon size={21} strokeWidth={1.6} />
            <span>{label}</span>
            {id === "tech" && pressureLow && <i className="nav-warning" />}
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      <dialog
        aria-labelledby="dialog-title"
        ref={dialogRef}
        className={`detail-dialog ${modal === "settings" ? "settings-dialog" : ""}`}
        onCancel={closeModal}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="dialog-content">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">
                {doorbell
                  ? "ER STAAT IEMAND VOOR DE DEUR"
                  : (realLights &&
                        (modal === "light" || modal === "kitchen")) ||
                      (shelly.live && modal === "shutter")
                    ? "LOKALE APPARAATBEDIENING"
                    : "MIJN WONING · DEMO"}
              </span>
              <h2 id="dialog-title">
                {modal === "settings"
                  ? "Helemaal jouw dashboard"
                  : modal === "notifications"
                    ? "Alles op een rij"
                    : modal === "system"
                      ? "Je woning achter de schermen"
                      : modal === "camera"
                        ? doorbell
                          ? "De deurbel gaat"
                          : "Welkom bij de voordeur"
                        : modal
                          ? `${widgetNames[modal]} bedienen`
                          : ""}
              </h2>
            </div>
            <button
              className="icon-button"
              aria-label="Venster sluiten"
              onClick={closeModal}
            >
              <X size={21} />
            </button>
          </div>
          {modal === "settings" && (
            <>
              <PwaControls />
              <HueSetup />
              <ShellySetup />
              <label className="text-label">
                Naam van je woning
                <input
                  maxLength={40}
                  value={state.name}
                  onChange={(e) =>
                    setState((s) => ({ ...s, name: e.target.value }))
                  }
                  onBlur={() => {
                    if (!state.name.trim())
                      setState((s) => ({ ...s, name: initialState.name }));
                  }}
                />
              </label>
              <LayoutEditor
                settings={layout}
                setSettings={setLayout}
                activeProfile={profile}
              />
              <button className="primary-button" onClick={closeModal}>
                Klaar <Check size={16} />
              </button>
            </>
          )}
          {((modal === "light" && !realLights) ||
            (modal === "shutter" && !shelly.live) ||
            modal === "music" ||
            modal === "climate") && (
            <DeviceControls device={modal} {...controlProps} />
          )}
          {modal === "light" && !realLights && (
            <div className="warmth-controls">
              <label className="slider-label" htmlFor="warmth">
                <span>Lichtkleur</span>
                <span>
                  {Math.round(2200 + (100 - state.lights.warmth) * 43)} K
                </span>
              </label>
              <input
                id="warmth"
                className="warmth-slider"
                type="range"
                min="0"
                max="100"
                value={state.lights.warmth}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    lights: { ...s.lights, warmth: +e.target.value },
                  }))
                }
              />
              <div className="range-captions">
                <span>Koel daglicht</span>
                <span>Warm kaarslicht</span>
              </div>
              <div
                className="color-preview"
                style={{
                  background: `hsl(${40 - state.lights.warmth * 0.12} 60% ${85 - state.lights.warmth * 0.4}%)`,
                }}
              />
            </div>
          )}
          {modal === "kitchen" && !realLights && (
            <div className="kitchen-control">
              <Lightbulb size={55} strokeWidth={1} />
              <p>Keukenverlichting · Philips Hue · demo</p>
              <Switch
                label="Keukenverlichting"
                on={state.lights.kitchen}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    scene: null,
                    lights: { ...s.lights, kitchen: !s.lights.kitchen },
                  }))
                }
              />
            </div>
          )}
          {hue.live && (modal === "light" || modal === "kitchen") && (
            <HueLights onMessage={notify} />
          )}
          {shelly.live && (modal === "light" || modal === "kitchen") && (
            <ShellyDevices kind="switch" onMessage={notify} />
          )}
          {shelly.live && modal === "shutter" && (
            <ShellyDevices kind="cover" onMessage={notify} />
          )}
          {modal === "camera" && (
            <>
              <div className="dialog-camera">
                <CameraArt />
                <span className="camera-overlay">
                  <span>Voordeur · illustratie</span>
                  <span>DEMO</span>
                </span>
              </div>
              <p className="screen-note">
                Dit is een geïllustreerd voorbeeld. Er is geen liveverbinding
                met je Eufy-deurbel.
              </p>
              {doorbell ? (
                <p className="countdown" role="status">
                  Dit venster sluit over {countdown} seconden.
                </p>
              ) : (
                <button className="primary-button" onClick={ringDoorbell}>
                  <Bell size={16} /> Simuleer aanbellen
                </button>
              )}
            </>
          )}
          {modal === "system" && (
            <>
              <div className="climate-details">
                <div>
                  <span>CV-waterdruk · demo</span>
                  <strong>{pressure} bar</strong>
                </div>
                <div>
                  <span>Voorbeeldstatus</span>
                  <strong>
                    {pressureLow ? "Lage druk gesimuleerd" : "Normaal"}
                  </strong>
                </div>
                <div>
                  <span>Apparaatkoppelingen</span>
                  <strong>
                    {localSummary
                      ? `${localSummary} · overige demo`
                      : "Allemaal demo"}
                  </strong>
                </div>
                <div>
                  <span>Webversie</span>
                  <strong>{__APP_VERSION__}</strong>
                </div>
              </div>
              <div className="info-box">
                <ShieldCheck size={20} />
                <p>
                  {localSummary
                    ? "Je gekoppelde Hue- en Shelly-apparaten worden lokaal bediend. De overige apparaten en camerabeelden zijn voorbeelden."
                    : "Deze versie gebruikt geen echte apparaten, camerastreams of accounts."}{" "}
                  Drukwaarschuwingen zijn een simulatie; livegrenzen moeten
                  later op je installatie worden afgestemd.
                </p>
              </div>
            </>
          )}
          {modal === "notifications" && (
            <>
              <div className="notification-entry">
                <span className="note-icon">
                  {pressureLow ? <Gauge size={22} /> : <Wifi size={22} />}
                </span>
                <div>
                  <strong>
                    {pressureLow
                      ? "Lage waterdruk · voorbeeldmelding"
                      : "Je woning is klaar voor jou"}
                  </strong>
                  <p>
                    {pressureLow
                      ? "De gesimuleerde waterdruk is 0,7 bar. Dit is geen actuele ketelwaarde. Herstel de voorbeeldwaarde via Techniek."
                      : "Je Home-overzicht past zich aan je scherm aan. Verander de dichtheid en je tegels via Instellingen."}
                  </p>
                  <small>Alleen demogegevens</small>
                </div>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  setNotificationsRead(true);
                  closeModal();
                  notify("Melding gemarkeerd als gelezen");
                }}
              >
                Markeer als gelezen <Check size={16} />
              </button>
            </>
          )}
        </div>
      </dialog>
      <PwaUpdateNotice visible={!modal} />
    </div>
  );
}
