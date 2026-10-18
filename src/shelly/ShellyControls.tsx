import { useState } from "react";
import { PositionSlider } from "./PositionSlider";
import {
  ArrowDown,
  ArrowUp,
  Blinds,
  ChevronRight,
  Lightbulb,
  PlugZap,
  Square,
  Trash2,
} from "lucide-react";
import { useShelly } from "./ShellyProvider";
import {
  coverState,
  type ShellyCommand,
  type ShellyDevice,
  type ShellyChannel,
} from "./model";
import { androidDownloadUrl } from "../hue/native";
import "../hue/hue.css";
import "./shelly.css";

function NameEditor({
  name,
  label,
  onSave,
}: {
  name: string;
  label: string;
  onSave(name: string): void;
}) {
  const [draft, setDraft] = useState(name),
    [error, setError] = useState("");
  return (
    <form
      className="shelly-name-editor"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onSave(draft);
          setError("");
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <label className="text-label">
        {label}
        <input
          aria-label={label}
          required
          maxLength={60}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <button
        className="hue-secondary"
        type="submit"
        disabled={draft.trim() === name}
      >
        Naam opslaan
      </button>
      {error && (
        <p className="hue-error" role="status">
          {error}
        </p>
      )}
    </form>
  );
}

export function ShellySetup() {
  const shelly = useShelly();
  const [ip, setIp] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [usePassword, setUsePassword] = useState(false),
    [remove, setRemove] = useState(""),
    [notice, setNotice] = useState("");
  const attempt = async (fn: () => Promise<void>) => {
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  return (
    <section className="hue-setup" aria-label="Shelly koppelen">
      <div className="hue-heading">
        <span className="device-icon">
          <PlugZap size={22} />
        </span>
        <div>
          <h3>Shelly Plus 2PM</h3>
          <p>Jouw rolluiken en twee lichtkanalen · lokaal via wifi</p>
        </div>
      </div>
      {!shelly.native ? (
        <>
          <p className="hue-help">
            Koppel je Shelly-modules in de Android-app, op hetzelfde
            thuisnetwerk. De webversie blijft demo.
          </p>
          <a className="hue-primary" href={androidDownloadUrl}>
            Android-app downloaden
          </a>
        </>
      ) : (
        <>
          <p className="hue-help">
            Voeg je drie modules één voor één toe: twee rolluikmodules en één
            lichtmodule. Het IP-adres vind je bij de apparaatinformatie in de
            Shelly-app. Toevoegen leest alleen de instellingen.
          </p>
          {shelly.devices.length > 0 && (
            <div className="hue-mode" aria-label="Shelly-modus">
              <button
                aria-pressed={!shelly.live}
                disabled={shelly.busy || shelly.pending.length > 0}
                onClick={() => shelly.setMode(false)}
              >
                Demo Shelly
              </button>
              <button
                aria-pressed={shelly.live}
                disabled={shelly.busy || shelly.pending.length > 0}
                onClick={() => shelly.setMode(true)}
              >
                Live Shelly
              </button>
            </div>
          )}
          {shelly.devices.map((d) => (
            <div className="shelly-saved" key={d.id}>
              <div>
                <strong>{d.name}</strong>
                <small>
                  {d.ip} ·{" "}
                  {d.profile === "cover" ? "Rolluik" : "Twee lichtkanalen"} ·{" "}
                  {shelly.live && d.available
                    ? "Verbonden"
                    : shelly.live
                      ? "Niet bereikbaar"
                      : "Demo"}
                </small>
              </div>
              <button
                className="icon-button"
                disabled={shelly.busy || shelly.pending.length > 0}
                aria-label={`${d.name} verwijderen`}
                onClick={() => setRemove(d.id)}
              >
                <Trash2 size={16} />
              </button>
              <details className="shelly-names">
                <summary>Namen aanpassen</summary>
                <p className="hue-footnote">
                  Deze namen worden op dit apparaat bewaard.
                </p>
                <NameEditor
                  key={`module:${d.name}`}
                  name={d.name}
                  label={`Naam module · ${d.name}`}
                  onSave={(name) => shelly.rename(d.id, name)}
                />
                {d.channels.map((c) => (
                  <NameEditor
                    key={`${c.id}:${c.name}`}
                    name={c.name}
                    label={`Naam kanaal ${c.id + 1} · ${d.name}`}
                    onSave={(name) => shelly.rename(d.id, name, c.id)}
                  />
                ))}
              </details>
              {remove === d.id && (
                <div className="shelly-remove">
                  <p>
                    Deze koppeling uit de app verwijderen? Je
                    Shelly-instellingen blijven behouden.
                  </p>
                  <button
                    className="hue-secondary"
                    onClick={() => setRemove("")}
                  >
                    Annuleren
                  </button>
                  <button
                    className="hue-secondary"
                    disabled={shelly.busy}
                    onClick={() =>
                      void attempt(async () => {
                        await shelly.remove(d.id);
                        setRemove("");
                      })
                    }
                  >
                    Koppeling verwijderen
                  </button>
                </div>
              )}
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void attempt(async () => {
                await shelly.add(
                  ip.trim(),
                  name.trim(),
                  usePassword ? password : "",
                );
                setPassword("");
                setIp("");
                setName("");
                setNotice(
                  "Module toegevoegd. Er zijn geen lampen of rolluiken aangestuurd.",
                );
              });
            }}
          >
            <label className="text-label">
              Naam van de module
              <input
                required
                maxLength={60}
                placeholder="Bijvoorbeeld Rolluik woonkamer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="text-label">
              Lokaal IP-adres van de Shelly
              <input
                required
                inputMode="decimal"
                autoComplete="off"
                placeholder="192.168.1.50"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
            </label>
            <label className="shelly-password">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => {
                  setUsePassword(e.target.checked);
                  if (!e.target.checked) setPassword("");
                }}
              />
              Deze module heeft een lokaal wachtwoord
            </label>
            {usePassword && (
              <label className="text-label">
                Lokaal Shelly-wachtwoord
                <input
                  required
                  type="password"
                  autoComplete="off"
                  maxLength={256}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            <button
              className="hue-primary"
              type="submit"
              disabled={shelly.busy || shelly.pending.length > 0}
            >
              {shelly.busy
                ? "Module controleren…"
                : "Shelly controleren en toevoegen"}
            </button>
          </form>
          <p className="hue-footnote">
            De Plus 2PM schakelt verlichting aan en uit; hij kan niet dimmen.
            Namen pas je hierboven aan; rolluikkalibratie beheer je in de
            Shelly-app. Voeg bij een gewijzigd IP-adres dezelfde module opnieuw
            toe.
          </p>
          <p className="hue-footnote">
            Deze Shelly-koppeling gebruikt de lokale HTTP-API op je
            thuisnetwerk. Een eventueel lokaal wachtwoord wordt versleuteld in
            de app opgeslagen.
          </p>
        </>
      )}
      {(notice || shelly.error) && (
        <p className="hue-error" role="status">
          {notice || shelly.error}
        </p>
      )}
    </section>
  );
}

function Channel({
  device,
  channel,
  onMessage,
}: {
  device: ShellyDevice;
  channel: ShellyChannel;
  onMessage(message: string): void;
}) {
  const shelly = useShelly();
  const pending = shelly.pending.includes(device.id),
    disabled =
      shelly.busy ||
      pending ||
      !device.available ||
      channel.fault ||
      channel.state === "calibrating";
  const run = async (command: Omit<ShellyCommand, "id" | "channel">) => {
    try {
      await shelly.command({ ...command, id: device.id, channel: channel.id });
      onMessage("Shelly heeft de opdracht bevestigd.");
    } catch (e) {
      onMessage((e as Error).message);
    }
  };
  return (
    <article className="hue-light-editor" aria-label={channel.name}>
      <div className="hue-light-heading">
        {channel.kind === "cover" ? (
          <Blinds size={21} />
        ) : (
          <Lightbulb size={21} />
        )}
        <div>
          <h3>{channel.name}</h3>
          <small>
            {device.name} ·{" "}
            {!device.available
              ? "Stand niet actueel"
              : channel.fault
                ? "Storing · controleer Shelly"
                : channel.kind === "switch"
                  ? channel.on
                    ? "Aan"
                    : "Uit"
                  : `${coverState(channel.state)}${channel.position === null ? "" : ` · ${channel.position}% open`}`}
          </small>
        </div>
        {channel.kind === "switch" && (
          <button
            className={`switch ${channel.on ? "on" : ""}`}
            role="switch"
            aria-checked={Boolean(channel.on)}
            aria-label={`${channel.name} schakelen`}
            disabled={disabled}
            onClick={() => void run({ action: channel.on ? "off" : "on" })}
          >
            <span />
          </button>
        )}
      </div>
      {channel.kind === "cover" && (
        <>
          <div className="shelly-cover-actions">
            <button
              disabled={disabled}
              onClick={() => void run({ action: "open" })}
              aria-label={`${channel.name} openen`}
            >
              <ArrowUp size={18} />
              Open
            </button>
            <button
              disabled={shelly.busy}
              onClick={() => void run({ action: "stop" })}
              aria-label={`${channel.name} stoppen`}
            >
              <Square size={14} />
              Stop
            </button>
            <button
              disabled={disabled}
              onClick={() => void run({ action: "close" })}
              aria-label={`${channel.name} sluiten`}
            >
              <ArrowDown size={18} />
              Sluit
            </button>
          </div>
          {channel.calibrated ? (
            <PositionSlider
              name={channel.name}
              value={channel.position}
              disabled={disabled}
              onCommit={(position) => run({ action: "position", position })}
            />
          ) : (
            <p className="hue-footnote">
              Procentbediening is beschikbaar na kalibratie in de Shelly-app.
              Open, stop en sluit werken zonder kalibratie.
            </p>
          )}
        </>
      )}
      {device.available && typeof channel.power === "number" && (
        <p className="hue-footnote">
          Actueel vermogen ·{" "}
          {channel.power.toLocaleString("nl-NL", { maximumFractionDigits: 1 })}{" "}
          W
        </p>
      )}
      {!device.available && (
        <p className="hue-error">
          {device.error ||
            "De module is niet bereikbaar. Controleer je thuisnetwerk."}
        </p>
      )}
    </article>
  );
}

export function ShellyDevices({
  kind,
  onMessage,
}: {
  kind: "cover" | "switch";
  onMessage(message: string): void;
}) {
  const shelly = useShelly();
  if (!shelly.live) return null;
  const devices = shelly.devices.filter((d) => d.profile === kind);
  return (
    <section
      aria-label={
        kind === "cover" ? "Mijn Shelly-rolluiken" : "Mijn Shelly-lampen"
      }
    >
      <p className="hue-live-info">
        <PlugZap size={14} />
        <span>Shelly · lokaal · status wordt automatisch ververst</span>
      </p>
      <button
        className="hue-secondary"
        disabled={shelly.busy || shelly.pending.length > 0}
        onClick={() => void shelly.refresh()}
      >
        Shelly-apparaten verversen
      </button>
      {devices.length === 0 && (
        <p className="hue-help">
          Geen {kind === "cover" ? "rolluikmodule" : "lichtmodule"} gekoppeld.
          Voeg deze toe bij Instellingen → Shelly Plus 2PM.
        </p>
      )}
      {devices.map((d) =>
        d.channels.length ? (
          d.channels.map((c) => (
            <Channel
              key={`${d.id}:${c.id}`}
              device={d}
              channel={c}
              onMessage={onMessage}
            />
          ))
        ) : (
          <p className="hue-error" key={d.id}>
            {d.name} · {d.error || "Status wordt opgehaald…"}
          </p>
        ),
      )}
    </section>
  );
}

export function ShellyHomeTile({
  device,
  onOpen,
  onMessage,
}: {
  device?: ShellyDevice;
  onOpen(): void;
  onMessage(message: string): void;
}) {
  const shelly = useShelly();
  const channel = device?.channels[0];
  const name = channel?.name || device?.name || "Rolluiken";
  const disabled =
    !device?.available ||
    !channel ||
    channel.fault ||
    channel.state === "calibrating" ||
    shelly.busy ||
    shelly.pending.includes(device.id);
  const run = async (command: Omit<ShellyCommand, "id" | "channel">) => {
    if (!device || !channel) return;
    try {
      await shelly.command({ ...command, id: device.id, channel: channel.id });
      onMessage("Shelly heeft de opdracht bevestigd.");
    } catch (e) {
      onMessage((e as Error).message);
    }
  };
  return (
    <article className="home-tile tile-shutter" aria-label={name}>
      <button
        className="tile-open"
        aria-label={`${name} bedienen`}
        onClick={onOpen}
      >
        <span className="device-icon">
          <Blinds size={21} />
        </span>
        <span>
          {name}
          <small>Shelly · rolluik</small>
        </span>
        <ChevronRight size={16} />
      </button>
      <div className="tile-value shelly-home-value">
        <strong>
          {device?.available && channel?.position != null
            ? channel.position
            : "–"}
          <small>%</small>
        </strong>
        <span>
          {device?.available
            ? coverState(channel?.state)
            : "Stand niet actueel"}
        </span>
      </div>
      {channel?.calibrated && (
        <PositionSlider
          name={name}
          value={channel.position}
          disabled={disabled}
          onCommit={(position) => run({ action: "position", position })}
        />
      )}
      <div className="tile-actions">
        <button
          className="tile-control"
          aria-label={`${name} openen`}
          disabled={disabled}
          onClick={() => void run({ action: "open" })}
        >
          <ArrowUp size={17} />
        </button>
        <button
          className="tile-control"
          aria-label={`${name} stoppen`}
          disabled={!channel || shelly.busy}
          onClick={() => void run({ action: "stop" })}
        >
          <Square size={12} />
        </button>
        <button
          className="tile-control"
          aria-label={`${name} sluiten`}
          disabled={disabled}
          onClick={() => void run({ action: "close" })}
        >
          <ArrowDown size={17} />
        </button>
      </div>
    </article>
  );
}
