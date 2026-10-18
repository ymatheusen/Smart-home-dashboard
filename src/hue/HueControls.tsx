import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Lightbulb,
  Link,
  RefreshCw,
  Search,
  Settings2,
  Star,
  Wifi,
  X,
} from "lucide-react";
import { useHue } from "./HueProvider";
import {
  defaultSceneIcon,
  SceneIcon,
  sceneIcons,
  type SceneIconId,
} from "./sceneIcons";
import { androidDownloadUrl } from "./native";
import { colorToXy, type HueBridgeInfo, type HueLight } from "./model";
import "./hue.css";

export function HueSetup() {
  const hue = useHue();
  const [ip, setIp] = useState(""),
    [found, setFound] = useState<{ ip: string; name: string }[]>([]),
    [candidate, setCandidate] = useState<HueBridgeInfo | null>(null),
    [notice, setNotice] = useState(""),
    [unlink, setUnlink] = useState(false);
  const perform = async (operation: () => Promise<void>) => {
    setNotice("");
    try {
      await operation();
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "De koppeling is niet gelukt.",
      );
    }
  };
  if (!hue.native)
    return (
      <section className="hue-setup" aria-label="Philips Hue koppelen">
        <div className="hue-heading">
          <span className="device-icon">
            <Lightbulb size={22} />
          </span>
          <div>
            <h3>Je eigen Philips Hue</h3>
            <p>Een lokale koppeling via de Android-app.</p>
          </div>
          <span className="tiny-label">NIEUW</span>
        </div>
        <p className="hue-help">
          De Android-app praat op je thuisnetwerk rechtstreeks met je Bridge. Je
          Hue-scènes blijven in de Hue-app beheerd.
        </p>
        <a
          className="hue-primary"
          href={androidDownloadUrl}
          download="Mijn-Woning.apk"
        >
          <Download size={16} /> Android-testapp downloaden
        </a>
        <p className="hue-footnote">
          Installeer de APK op je eigen Android-toestel. Deze browser blijft in
          demomodus. Werkende hardware wordt pas na koppelen live weergegeven.
        </p>
      </section>
    );
  return (
    <section className="hue-setup" aria-label="Philips Hue koppelen">
      <div className="hue-heading">
        <span className="device-icon">
          <Lightbulb size={22} />
        </span>
        <div>
          <h3>Philips Hue, bij jou thuis</h3>
          <p>
            {hue.paired
              ? hue.snapshot?.bridge.name || "Bridge gekoppeld"
              : "Koppel je vierkante Hue Bridge (v2 of nieuwer)."}
          </p>
        </div>
        <span className="tiny-label">LOKAAL</span>
      </div>
      <div className="hue-mode">
        <button
          aria-pressed={!hue.live}
          disabled={hue.busy}
          onClick={() => hue.setMode(false)}
        >
          Demo
        </button>
        <button
          aria-pressed={hue.live}
          disabled={!hue.paired || hue.busy}
          onClick={() => hue.setMode(true)}
        >
          Live
        </button>
      </div>
      {hue.paired && (
        <>
          <p className="hue-connection">
            <span
              className={
                hue.live && hue.available ? "status-dot" : "warning-dot"
              }
            />
            {hue.live
              ? hue.available
                ? `Live via ${hue.snapshot?.bridge.ip}`
                : "Bridge nu niet bereikbaar · bediening geblokkeerd"
              : "Demomodus · geen echte opdrachten"}
          </p>
          <button
            className="hue-secondary"
            disabled={hue.busy}
            onClick={() => void perform(() => hue.refresh())}
          >
            <RefreshCw size={14} /> Lampen en scènes verversen
          </button>
          <button
            className="text-button"
            disabled={hue.busy}
            onClick={() => setUnlink((v) => !v)}
          >
            Deze Bridge ontkoppelen
          </button>
          {unlink && (
            <div className="hue-confirm">
              <p>
                Dit wist de sleutel alleen uit deze app. Je lampen en Hue-scènes
                blijven behouden.
              </p>
              <button
                className="hue-secondary"
                disabled={hue.busy}
                onClick={() =>
                  void perform(async () => {
                    await hue.disconnect();
                    setCandidate(null);
                    setUnlink(false);
                  })
                }
              >
                Ja, ontkoppel deze app
              </button>
            </div>
          )}
        </>
      )}
      {!hue.paired && (
        <>
          <p className="hue-help">
            Verbind je telefoon met hetzelfde thuisnetwerk als de Bridge. Een
            gastnetwerk kan lokaal verkeer blokkeren. De app verstuurt tijdens
            het koppelen nog geen lichtopdrachten.
          </p>
          <button
            className="hue-secondary"
            disabled={hue.busy}
            onClick={() =>
              void perform(async () => {
                const bridges = await hue.discover();
                setFound(bridges);
                if (!bridges.length)
                  setNotice(
                    "Geen Bridge gevonden. Je kunt het IP-adres uit de Hue-app handmatig invullen.",
                  );
              })
            }
          >
            <Search size={15} />
            {hue.busy ? "Even wachten…" : "Zoek Bridge op mijn wifi"}
          </button>
          {found.map((b) => (
            <button
              className="hue-found"
              disabled={hue.busy}
              key={b.ip}
              onClick={() =>
                void perform(async () => {
                  setIp(b.ip);
                  setCandidate(await hue.inspect(b.ip));
                })
              }
            >
              <Wifi size={16} />
              <span>
                {b.name}
                <small>{b.ip}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          <label className="text-label">
            Lokaal IP-adres van de Bridge
            <input
              placeholder="Bijvoorbeeld 192.168.1.20"
              inputMode="decimal"
              value={ip}
              onChange={(e) => {
                setIp(e.target.value.trim());
                setCandidate(null);
              }}
            />
          </label>
          <button
            className="hue-secondary"
            disabled={hue.busy || !ip}
            onClick={() =>
              void perform(async () => setCandidate(await hue.inspect(ip)))
            }
          >
            <Link size={15} /> Controleer deze Bridge
          </button>
          {candidate && (
            <div className="hue-pair">
              <span className="tiny-label">
                <Check size={13} /> HUE-CERTIFICAAT GECONTROLEERD
              </span>
              <h4>{candidate.name}</h4>
              <p>
                {candidate.ip} · Bridge {candidate.id}
              </p>
              <ol>
                <li>Druk op de ronde fysieke knop boven op je Bridge.</li>
                <li>Tik binnen 30 seconden op de knop hieronder.</li>
              </ol>
              <button
                className="hue-primary"
                disabled={hue.busy}
                onClick={() =>
                  void perform(async () => {
                    await hue.pair(candidate);
                    setNotice(
                      "Bridge gekoppeld. Kies hieronder je favoriete Hue-scènes.",
                    );
                  })
                }
              >
                Knop ingedrukt · koppel nu
              </button>
            </div>
          )}
        </>
      )}
      {(notice || hue.error) && (
        <p className="hue-error" role="status">
          {notice || hue.error}
        </p>
      )}
      {hue.paired && hue.snapshot && (
        <>
          <div className="editor-heading">
            <h3>Hue-scènes op Home</h3>
            <span>{hue.favorites.length} gekozen</span>
          </div>
          <p className="hue-footnote">
            Maak of wijzig scènes in de Hue-app en tik daarna op verversen. Je
            kiest hier snelknoppen en hun icoon. Extra scènes krijgen een
            volgende pagina.
          </p>
          <div className="hue-scene-options">
            {hue.snapshot.scenes.length ? (
              hue.snapshot.scenes.map((s) => (
                <div className="hue-scene-option" key={s.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={hue.favorites.includes(s.id)}
                      onChange={() => hue.favorite(s.id)}
                    />
                    <span>{s.name}</span>
                    <Star
                      size={15}
                      fill={
                        hue.favorites.includes(s.id) ? "currentColor" : "none"
                      }
                    />
                  </label>
                  <details className="hue-icon-picker">
                    <summary aria-label={`Icoon aanpassen · ${s.name}`}>
                      <SceneIcon
                        id={hue.icons[s.id] || defaultSceneIcon(s.name)}
                        size={18}
                      />{" "}
                      Icoon
                    </summary>
                    <div
                      className="hue-icon-grid"
                      aria-label={`Icoon voor ${s.name}`}
                    >
                      {(Object.keys(sceneIcons) as SceneIconId[]).map((id) => (
                        <button
                          key={id}
                          type="button"
                          aria-label={`${sceneIcons[id].label} voor ${s.name}`}
                          title={sceneIcons[id].label}
                          aria-pressed={
                            (hue.icons[s.id] || defaultSceneIcon(s.name)) === id
                          }
                          onClick={() => hue.setIcon(s.id, id)}
                        >
                          <SceneIcon id={id} size={22} />
                          <span>{sceneIcons[id].label}</span>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              ))
            ) : (
              <p className="hue-help">
                Nog geen opgeslagen scènes gevonden. Sla in de Hue-app een scène
                op bij een kamer of zone en ververs deze lijst.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function HueHomeScenes({
  onSetup,
  onMessage,
}: {
  onSetup: () => void;
  onMessage: (message: string) => void;
}) {
  const hue = useHue(),
    [page, setPage] = useState(0);
  const selected =
    hue.snapshot?.scenes.filter((s) => hue.favorites.includes(s.id)) || [];
  const count = Math.max(1, Math.ceil(selected.length / 6)),
    safe = Math.min(page, count - 1);
  return (
    <section
      className="home-scenes hue-home-scenes"
      aria-label="Mijn Hue-scènes"
    >
      <div className="compact-heading">
        <h2>Jouw Hue-scènes</h2>
        <button className="text-button" onClick={onSetup}>
          <Settings2 size={12} />
          {selected.length > 6 ? `${safe + 1}/${count} · ` : ""}Kiezen
        </button>
      </div>
      {selected.length ? (
        <>
          <div className="scenes">
            {selected.slice(safe * 6, safe * 6 + 6).map((s) => (
              <button
                key={s.id}
                className={`scene ${s.active && hue.available ? "active" : ""}`}
                disabled={hue.busy || !hue.available}
                title={s.name}
                onClick={() =>
                  void hue
                    .scene(s.id)
                    .then(() =>
                      onMessage("Hue heeft de scène-opdracht bevestigd."),
                    )
                    .catch((e) => onMessage(e.message))
                }
              >
                <SceneIcon id={hue.icons[s.id] || defaultSceneIcon(s.name)} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          {count > 1 && (
            <div className="hue-scene-pages">
              <button
                aria-label="Vorige Hue-scènes"
                disabled={safe === 0}
                onClick={() => setPage(safe - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              <span>
                {safe + 1} / {count}
              </span>
              <button
                aria-label="Volgende Hue-scènes"
                disabled={safe === count - 1}
                onClick={() => setPage(safe + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        <button className="hue-empty-scenes" onClick={onSetup}>
          <Star size={20} />
          <span>
            Kies je favoriete scènes uit de Hue-app
            <small>Je eigen sfeer, direct op Home.</small>
          </span>
          <ChevronRight size={17} />
        </button>
      )}
      {!hue.available && (
        <p className="hue-unavailable">
          Bridge niet bereikbaar · er worden geen opdrachten verstuurd.
        </p>
      )}
    </section>
  );
}

function LightEditor({
  light,
  onMessage,
}: {
  light: HueLight;
  onMessage: (message: string) => void;
}) {
  const hue = useHue(),
    [brightness, setBrightness] = useState(Math.round(light.brightness)),
    [mirek, setMirek] = useState(light.mirek || 370),
    [color, setColor] = useState("#e8bd78"),
    [kind, setKind] = useState<"unchanged" | "temperature" | "color">(
      "unchanged",
    );
  useEffect(() => {
    setBrightness(Math.round(light.brightness));
    if (light.mirek) setMirek(light.mirek);
  }, [light.brightness, light.mirek]);
  const disabled = !hue.available || !light.reachable || hue.busy;
  const apply = () =>
    void hue
      .light({
        id: light.id,
        ...(light.dimmable ? { brightness } : {}),
        ...(kind === "color" && light.color
          ? colorToXy(color)
          : kind === "temperature" && light.temperature
            ? { mirek }
            : {}),
      })
      .then(() => onMessage("Hue heeft je lichtinstelling bevestigd."))
      .catch((e) => onMessage(e.message));
  return (
    <article className="hue-light-editor">
      <div className="hue-light-heading">
        <Lightbulb size={20} />
        <div>
          <h3>{light.name}</h3>
          <small>
            {light.room} ·{" "}
            {!hue.available
              ? "Laatst bekende stand"
              : light.reachable
                ? light.on
                  ? "Aan"
                  : "Uit"
                : "Niet bereikbaar"}
          </small>
        </div>
        <button
          className={`switch ${light.on ? "on" : ""}`}
          role="switch"
          aria-label={`${light.name} schakelen`}
          aria-checked={light.on}
          disabled={disabled}
          onClick={() =>
            void hue
              .light({ id: light.id, on: !light.on })
              .catch((e) => onMessage(e.message))
          }
        >
          <span />
        </button>
      </div>
      {light.dimmable && (
        <label className="hue-slider">
          Helderheid <span>{brightness}%</span>
          <input
            type="range"
            min="1"
            max="100"
            value={brightness}
            disabled={disabled}
            onChange={(e) => setBrightness(+e.target.value)}
          />
        </label>
      )}
      {(light.color || light.temperature) && (
        <div className="hue-mode">
          <button
            aria-pressed={kind === "unchanged"}
            onClick={() => setKind("unchanged")}
          >
            Behouden
          </button>
          {light.temperature && (
            <button
              aria-pressed={kind === "temperature"}
              onClick={() => setKind("temperature")}
            >
              Wit licht
            </button>
          )}
          {light.color && (
            <button
              aria-pressed={kind === "color"}
              onClick={() => setKind("color")}
            >
              Kleur
            </button>
          )}
        </div>
      )}
      {kind === "color" && light.color ? (
        <label className="hue-color">
          Lichtkleur
          <input
            aria-label={`Lichtkleur ${light.name}`}
            type="color"
            value={color}
            disabled={disabled}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
      ) : (
        kind === "temperature" &&
        light.temperature && (
          <label className="hue-slider">
            Wittemperatuur <span>{Math.round(1000000 / mirek)} K</span>
            <input
              type="range"
              min={light.minMirek}
              max={light.maxMirek}
              value={mirek}
              disabled={disabled}
              onChange={(e) => setMirek(+e.target.value)}
            />
          </label>
        )
      )}
      {(light.dimmable || light.color || light.temperature) && (
        <button
          className="hue-secondary"
          disabled={disabled || (!light.dimmable && kind === "unchanged")}
          onClick={apply}
        >
          Lichtinstelling toepassen
        </button>
      )}
    </article>
  );
}
export function HueLights({
  onMessage,
}: {
  onMessage: (message: string) => void;
}) {
  const hue = useHue(),
    [room, setRoom] = useState("Alle kamers");
  const rooms = [
    "Alle kamers",
    ...new Set(hue.snapshot?.lights.map((l) => l.room) || []),
  ];
  return (
    <section className="hue-lights">
      <div className="hue-live-info">
        <span className={hue.available ? "status-dot" : "warning-dot"} />
        <span>
          {hue.available
            ? "Live via je lokale Hue Bridge"
            : "Bridge niet bereikbaar · laatst bekende gegevens"}
        </span>
        <button
          className="icon-button"
          aria-label="Hue-lampen verversen"
          disabled={hue.busy}
          onClick={() => void hue.refresh()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {hue.error && (
        <p className="hue-error" role="status">
          {hue.error}
        </p>
      )}
      <label className="hue-room-select">
        Kamer
        <select value={room} onChange={(e) => setRoom(e.target.value)}>
          {rooms.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      {hue.snapshot?.lights
        .filter((l) => room === "Alle kamers" || l.room === room)
        .map((l) => (
          <LightEditor key={l.id} light={l} onMessage={onMessage} />
        ))}
      {!hue.snapshot?.lights.length && (
        <p className="hue-help">
          Geen lampen gevonden. Controleer de lampen in je Hue-app en ververs.
        </p>
      )}
    </section>
  );
}
