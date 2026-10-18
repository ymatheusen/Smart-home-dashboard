import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Blinds,
  Check,
  ChevronRight,
  CloudSun,
  Coffee,
  DoorOpen,
  Expand,
  Home,
  LampDesk,
  Leaf,
  Lightbulb,
  Minus,
  Moon,
  MoreHorizontal,
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
  Snowflake,
  Square,
  Sun,
  Sunset,
  Thermometer,
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import { initialState, loadState, storageKey, type Scene } from "./model";

const tracks = [
  {
    title: "Weightless",
    artist: "Marconi Union",
    collection: "Even helemaal thuis",
    duration: 489,
  },
  {
    title: "A Walk",
    artist: "Tycho",
    collection: "Rust in je hoofd",
    duration: 316,
  },
  {
    title: "Sunset Lover",
    artist: "Petit Biscuit",
    collection: "Een gouden avond",
    duration: 237,
  },
];
const sceneList = [
  { name: "Goedemorgen", icon: Coffee },
  { name: "Overdag", icon: Sun },
  { name: "Avond", icon: Sunset },
  { name: "Filmavond", icon: Play },
  { name: "Welterusten", icon: Moon },
  { name: "Alles uit", icon: Power },
] as const;
type Modal =
  "settings" | "climate" | "light" | "camera" | "notifications" | null;
const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function Switch({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`switch ${on ? "on" : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
    >
      <span />
    </button>
  );
}
function CardHeader({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="card-header">
      <div className="device-icon">{icon}</div>
      <div className="device-title">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      {children}
    </div>
  );
}
function CameraArt() {
  return (
    <div
      className="camera-art"
      aria-label="Geïllustreerd voorbeeld van de voordeur, geen camerabeeld"
      role="img"
    >
      <div className="wall-lines" />
      <div className="porch-light" />
      <div className="house-number">24</div>
      <div className="front-door">
        <span className="door-glass" />
        <span className="door-handle" />
      </div>
      <div className="plant">
        <i />
        <i />
        <i />
        <b />
      </div>
      <span className="camera-caption">VOORBEELDBEELD</span>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#home" className="brand" aria-label="Mijn Woning, Home">
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
            <span /> Demo actief
          </span>
          <button
            className="icon-button notification-button"
            aria-label="Meldingen"
            onClick={() => setModal("notifications")}
          >
            <Bell size={20} />
            {!notificationsRead && <i />}
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

      <main id="home">
        <section className="welcome">
          <div className="welcome-copy">
            <div className="eyebrow">
              <span /> EEN FIJNE PLEK OM THUIS TE KOMEN
            </div>
            <h1>
              Welkom thuis<span>.</span>
            </h1>
            <p>Alles op zijn plek. Precies zoals jij het wilt.</p>
          </div>
          <div className="time-weather">
            <div className="clock">
              {now.toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              <span>
                {now.toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="weather">
              <CloudSun size={35} strokeWidth={1.2} />
              <div>
                16°<span>Halfbewolkt · demo</span>
              </div>
            </div>
          </div>
        </section>

        <section className="overview" aria-label="Woningoverzicht">
          <span>
            <span className="status-dot" />
            Je woning in balans
          </span>
          <span>
            <Lightbulb size={15} />
            {activeLights} {activeLights === 1 ? "licht" : "lichten"} aan
          </span>
          <span>
            <Thermometer size={15} />
            20,5° binnen
          </span>
          <span>
            <ShieldCheck size={15} />
            Geen waarschuwingen
          </span>
          <span className="overview-demo">GESIMULEERDE GEGEVENS</span>
        </section>

        <section className="scenes-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HET JUISTE MOMENT</span>
              <h2>Jouw scènes</h2>
            </div>
            <span className="section-note">Een tik. Een andere sfeer.</span>
          </div>
          <div className="scenes">
            {sceneList.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={`scene ${state.scene === name ? "active" : ""}`}
                onClick={() => applyScene(name)}
                aria-pressed={state.scene === name}
              >
                <span className="scene-icon">
                  <Icon size={22} strokeWidth={1.4} />
                </span>
                <span>{name}</span>
                {state.scene === name && <span className="scene-indicator" />}
              </button>
            ))}
          </div>
        </section>

        <section className="devices-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BINNEN HANDBEREIK</span>
              <h2>Thuis, op jouw manier</h2>
            </div>
            <span className="favorite-tag">
              <span /> Jouw favorieten
            </span>
          </div>
          <div className="widget-grid">
            <article
              className={`card light-card ${state.lights.living ? "lit" : ""}`}
            >
              <CardHeader
                icon={<Lightbulb size={22} strokeWidth={1.5} />}
                title="Sfeerverlichting"
                subtitle="Woonkamer · Philips Hue"
              >
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
              </CardHeader>
              <div className="light-visual">
                <div
                  className={`lamp-glow ${state.lights.living ? "visible" : ""}`}
                />
                <LampDesk size={87} strokeWidth={0.85} />
                <div>
                  <span className="large-number">
                    {state.lights.living ? state.lights.brightness : 0}
                    <small>%</small>
                  </span>
                  <span className="muted">
                    {state.lights.living
                      ? "Een warme gloed"
                      : "Even uitgeschakeld"}
                  </span>
                </div>
              </div>
              <div className="slider-label">
                <span>Helderheid</span>
                <Sun size={16} />
              </div>
              <input
                aria-label="Helderheid woonkamer"
                type="range"
                min="1"
                max="100"
                value={state.lights.brightness}
                disabled={!state.lights.living}
                style={
                  {
                    "--fill": `${state.lights.brightness}%`,
                  } as React.CSSProperties
                }
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    scene: null,
                    lights: { ...s.lights, brightness: +e.target.value },
                  }))
                }
              />
              <button
                className="card-footer button-footer"
                onClick={() => setModal("light")}
              >
                <span>
                  <i className="warm-dot" /> Warm wit{" "}
                  <span className="muted">
                    · {Math.round(2200 + (100 - state.lights.warmth) * 43)} K
                  </span>
                </span>
                <ChevronRight size={16} />
              </button>
            </article>

            <article className="card climate-card">
              <CardHeader
                icon={<Thermometer size={22} strokeWidth={1.5} />}
                title="Een aangenaam thuis"
                subtitle="Woonkamer · Remeha"
              >
                <span className="tiny-label">
                  <Leaf size={13} /> ECO
                </span>
              </CardHeader>
              <div className="thermostat">
                <div className="thermostat-inner">
                  <span>BINNENTEMPERATUUR</span>
                  <strong>
                    20,5<small>°</small>
                  </strong>
                  <span className="heating">
                    <span />{" "}
                    {state.target > 20.5
                      ? "Verwarming actief"
                      : "Op temperatuur"}
                  </span>
                </div>
              </div>
              <div className="temperature-control">
                <button
                  className="round-button"
                  aria-label="Temperatuur verlagen"
                  disabled={state.target <= 15}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      target: Math.max(15, s.target - 0.5),
                    }))
                  }
                >
                  <Minus size={18} />
                </button>
                <span>
                  Ingesteld op{" "}
                  <strong>
                    {state.target.toLocaleString("nl-NL", {
                      minimumFractionDigits: 1,
                    })}
                    °
                  </strong>
                </span>
                <button
                  className="round-button"
                  aria-label="Temperatuur verhogen"
                  disabled={state.target >= 25}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      target: Math.min(25, s.target + 0.5),
                    }))
                  }
                >
                  <Plus size={18} />
                </button>
              </div>
              <button
                className="card-footer button-footer"
                onClick={() => setModal("climate")}
              >
                <span>Comfort zit in de details</span>
                <ArrowUpRight size={16} />
              </button>
            </article>

            <article className="card shutter-card">
              <CardHeader
                icon={<Blinds size={22} strokeWidth={1.5} />}
                title="Licht van buiten"
                subtitle="Woonkamer · Shelly"
              >
                <span className="online-dot" title="Demoapparaat online" />
              </CardHeader>
              <div className="shutter-body">
                <div className="window-illustration">
                  <div className="window-sky" />
                  <div
                    className="shutter-slats"
                    style={{ height: `${100 - state.shutter}%` }}
                  />
                  <div className="window-frame" />
                </div>
                <div className="shutter-description">
                  <span className="large-number">
                    {state.shutter}
                    <small>%</small>
                  </span>
                  <span className="muted">
                    {shutterTarget === null
                      ? "geopend"
                      : shutterTarget > state.shutter
                        ? "Wordt geopend…"
                        : "Wordt gesloten…"}
                  </span>
                  <span className="subtle-tag">Rolluik voorzijde</span>
                </div>
              </div>
              <input
                aria-label="Rolluikpositie"
                type="range"
                min="0"
                max="100"
                value={shutterTarget ?? state.shutter}
                style={
                  {
                    "--fill": `${shutterTarget ?? state.shutter}%`,
                  } as React.CSSProperties
                }
                onChange={(e) => setShutterTarget(+e.target.value)}
              />
              <div className="shutter-buttons">
                <button onClick={() => setShutterTarget(100)}>
                  <ArrowUp size={17} /> Open
                </button>
                <button
                  onClick={() => setShutterTarget(null)}
                  aria-label="Rolluik stoppen"
                >
                  <Square size={13} /> Stop
                </button>
                <button onClick={() => setShutterTarget(0)}>
                  <ArrowDown size={17} /> Dicht
                </button>
              </div>
            </article>

            <article className="card music-card">
              <CardHeader
                icon={<Music2 size={21} strokeWidth={1.5} />}
                title="De soundtrack van thuis"
                subtitle="Muziek · gesimuleerde speler"
              >
                <span className="music-bars">
                  <i />
                  <i />
                  <i />
                </span>
              </CardHeader>
              <div className="track-info">
                <div className={`album-art album-${state.music.track}`}>
                  <div className="album-sun" />
                  <div className="album-ridge ridge-back" />
                  <div className="album-ridge ridge-front" />
                  <span>
                    {state.music.track === 0
                      ? "WEIGHTLESS"
                      : state.music.track === 1
                        ? "DIVE"
                        : "SUNSET LOVER"}
                  </span>
                </div>
                <div>
                  <span className="eyebrow">{track.collection}</span>
                  <h3>{track.title}</h3>
                  <p>{track.artist}</p>
                  <span className="speaker-label">
                    <Volume2 size={12} /> Woonkamer · demo
                  </span>
                </div>
              </div>
              <div className="music-progress">
                <input
                  aria-label="Afspeelpositie"
                  type="range"
                  min="0"
                  max={track.duration}
                  value={elapsed}
                  style={
                    {
                      "--fill": `${(elapsed / track.duration) * 100}%`,
                    } as React.CSSProperties
                  }
                  onChange={(e) => setElapsed(+e.target.value)}
                />
                <div>
                  <span>{formatTime(elapsed)}</span>
                  <span>{formatTime(track.duration)}</span>
                </div>
              </div>
              <div className="music-controls">
                <button
                  className="icon-button"
                  aria-label="Vorig nummer"
                  onClick={() => changeTrack(-1)}
                >
                  <SkipBack size={19} fill="currentColor" />
                </button>
                <button
                  className="play-button"
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
                  {state.music.playing ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                </button>
                <button
                  className="icon-button"
                  aria-label="Volgend nummer"
                  onClick={() => changeTrack(1)}
                >
                  <SkipForward size={19} fill="currentColor" />
                </button>
                <label className="volume">
                  <Volume2 size={16} />
                  <input
                    aria-label="Muziekvolume"
                    type="range"
                    min="0"
                    max="100"
                    value={state.music.volume}
                    style={
                      {
                        "--fill": `${state.music.volume}%`,
                      } as React.CSSProperties
                    }
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        music: { ...s.music, volume: +e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            </article>

            <article className="card camera-card">
              <CardHeader
                icon={<DoorOpen size={22} strokeWidth={1.5} />}
                title="Een oogje in het zeil"
                subtitle="Voordeur · Eufy"
              >
                <span className="tiny-label">DEMO</span>
              </CardHeader>
              <button
                className="camera-preview"
                onClick={() => {
                  setDoorbell(false);
                  setModal("camera");
                }}
                aria-label="Voorbeeld voordeur vergroten"
              >
                <CameraArt />
                <span className="camera-overlay">
                  <span>
                    <span className="status-dot" /> Voordeur
                  </span>
                  <Expand size={17} />
                </span>
              </button>
              <div className="camera-footer">
                <span>
                  <ShieldCheck size={14} /> Alles rustig bij de voordeur
                </span>
                <button onClick={ringDoorbell}>
                  <Bell size={14} /> Test deurbel
                </button>
              </div>
            </article>

            <article className="card little-things">
              <div className="section-heading">
                <h3>De kleine dingen</h3>
                <MoreHorizontal size={21} />
              </div>
              <div className="quick-device">
                <div
                  className={`quick-icon ${state.lights.kitchen ? "enabled" : ""}`}
                >
                  <Lightbulb size={21} strokeWidth={1.4} />
                </div>
                <div>
                  <strong>Keukenverlichting</strong>
                  <span>
                    {state.lights.kitchen
                      ? "Aan · warm wit"
                      : "Uit · klaar voor later"}
                  </span>
                </div>
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
              <div className="home-note">
                <span className="note-icon">
                  <Leaf size={20} strokeWidth={1.3} />
                </span>
                <div>
                  <strong>Even niets hoeven.</strong>
                  <p>
                    Je huis zorgt voor de juiste sfeer.
                    <br />
                    Jij hoeft alleen maar thuis te zijn.
                  </p>
                </div>
              </div>
              <div className="demo-note">
                <span className="status-dot" /> Ontdek je woning in demomodus
              </div>
            </article>
          </div>
        </section>
        {storageError && (
          <p className="storage-warning" role="alert">
            Instellingen kunnen niet worden opgeslagen. Controleer de
            opslagrechten van je browser.
          </p>
        )}
        <footer className="page-footer">
          <span>
            <Home size={13} /> Met aandacht voor jouw thuis.
          </span>
          <span>
            Concept 01 <span>·</span> Midnight Gold
          </span>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="Hoofdnavigatie">
        <a className="nav-item selected" href="#home" aria-current="page">
          <Home size={21} strokeWidth={1.6} />
          <span>Home</span>
        </a>
        <span className="nav-item future">
          <LampDesk size={21} strokeWidth={1.6} />
          <span>Kamers</span>
          <small>Later</small>
        </span>
        <button className="nav-item" onClick={() => setModal("climate")}>
          <Thermometer size={21} strokeWidth={1.6} />
          <span>Klimaat</span>
        </button>
        <button
          className="nav-item"
          onClick={() => {
            setDoorbell(false);
            setModal("camera");
          }}
        >
          <ShieldCheck size={21} strokeWidth={1.6} />
          <span>Camera</span>
        </button>
        <span className="nav-item future">
          <SlidersHorizontal size={21} strokeWidth={1.6} />
          <span>Techniek</span>
          <small>Later</small>
        </span>
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
        className={`detail-dialog ${modal === "camera" ? "camera-dialog" : ""}`}
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
                  : "MIJN WONING · DEMO"}
              </span>
              <h2 id="dialog-title">
                {modal === "settings"
                  ? "Jouw thuis, jouw naam"
                  : modal === "light"
                    ? "Een warme sfeer"
                    : modal === "climate"
                      ? "Comfort in huis"
                      : modal === "notifications"
                        ? "Alles op een rij"
                        : doorbell
                          ? "De deurbel gaat"
                          : "Welkom bij de voordeur"}
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
              <p>
                Geef je dashboard een eigen naam. Je keuze wordt op dit apparaat
                bewaard.
              </p>
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
              <div className="info-box">
                <Settings2 size={21} />
                <p>
                  Dit is de eerste ontwerpversie. De uitgebreide thema- en
                  dashboard-editor volgen na jouw beoordeling.
                </p>
              </div>
              <button className="primary-button" onClick={closeModal}>
                Klaar <Check size={16} />
              </button>
            </>
          )}
          {modal === "light" && (
            <>
              <p>
                Kies hoe warm je woonkamer aanvoelt. Alle wijzigingen zijn
                gesimuleerd.
              </p>
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
                <span>
                  <Snowflake size={14} /> Koel daglicht
                </span>
                <span>
                  <Sunset size={14} /> Warm kaarslicht
                </span>
              </div>
              <div
                className="color-preview"
                style={{
                  background: `hsl(${40 - state.lights.warmth * 0.12} 60% ${85 - state.lights.warmth * 0.4}%)`,
                }}
              />
              <button className="primary-button" onClick={closeModal}>
                Sfeer bewaren <Check size={16} />
              </button>
            </>
          )}
          {modal === "climate" && (
            <>
              <p>
                Een comfortabel begin. Deze waarden zijn voorbeelden en komen
                niet van je ketel.
              </p>
              <div className="climate-details">
                <div>
                  <span>Kamertemperatuur</span>
                  <strong>20,5 °C</strong>
                </div>
                <div>
                  <span>Doeltemperatuur</span>
                  <strong>{state.target.toLocaleString("nl-NL")} °C</strong>
                </div>
                <div>
                  <span>CV-waterdruk · demo</span>
                  <strong>1,2 bar</strong>
                </div>
                <div>
                  <span>Voorbeeldstatus ketel</span>
                  <strong>Normaal</strong>
                </div>
              </div>
              <div className="info-box">
                <Leaf size={21} />
                <p>
                  De uitgebreide klimaatpagina en instelbare drukwaarschuwingen
                  volgen in de volgende bouwfase.
                </p>
              </div>
            </>
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
              <div className="info-box">
                <ShieldCheck size={21} />
                <p>
                  Dit is een geïllustreerd voorbeeld. Er is geen liveverbinding
                  met je Eufy-deurbel.
                </p>
              </div>
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
          {modal === "notifications" && (
            <>
              <div className="notification-entry">
                <span className="note-icon">
                  <Wifi size={22} />
                </span>
                <div>
                  <strong>Je demo staat voor je klaar</strong>
                  <p>
                    Ontdek de scènes en probeer je apparaten. Er worden geen
                    echte apparaten aangestuurd.
                  </p>
                  <small>Alleen voorbeeldgegevens</small>
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
    </div>
  );
}
