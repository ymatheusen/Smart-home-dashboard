import type { Dispatch, SetStateAction } from "react";
import type { HomeState } from "../model";
import type { WidgetId } from "../layout";
import { tracks } from "../tracks";
import { CardHeader, Switch } from "./DevicePrimitives";
import {
  ArrowDown,
  ArrowUp,
  Blinds,
  LampDesk,
  Leaf,
  Lightbulb,
  Minus,
  Music2,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Square,
  Sun,
  Thermometer,
  Volume2,
} from "lucide-react";

interface Props {
  device: WidgetId;
  state: HomeState;
  setState: Dispatch<SetStateAction<HomeState>>;
  shutterTarget: number | null;
  setShutterTarget: Dispatch<SetStateAction<number | null>>;
  elapsed: number;
  setElapsed: Dispatch<SetStateAction<number>>;
  changeTrack: (direction: number) => void;
}
export function DeviceControls({
  device,
  state,
  setState,
  shutterTarget,
  setShutterTarget,
  elapsed,
  setElapsed,
  changeTrack,
}: Props) {
  const track = tracks[state.music.track];
  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  if (device === "light")
    return (
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
              {state.lights.living ? "Een warme gloed" : "Even uitgeschakeld"}
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
      </article>
    );
  if (device === "climate")
    return (
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
              {state.target > 20.5 ? "Verwarming actief" : "Op temperatuur"}
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
      </article>
    );
  if (device === "shutter")
    return (
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
    );
  if (device === "music")
    return (
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
    );
  return null;
}
