import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  defaultProfile,
  widgetNames,
  type LayoutSettings,
  type Profile,
  type WidgetId,
} from "../layout";

export function LayoutEditor({
  settings,
  setSettings,
  activeProfile,
}: {
  settings: LayoutSettings;
  setSettings: Dispatch<SetStateAction<LayoutSettings>>;
  activeProfile: Profile;
}) {
  const [profile, setProfile] = useState<Profile>(activeProfile);
  const current = settings[profile];
  const move = (id: WidgetId, direction: number) =>
    setSettings((s) => {
      const order = [...s[profile].order];
      const from = order.indexOf(id),
        to = from + direction;
      if (to < 0 || to >= order.length) return s;
      [order[from], order[to]] = [order[to], order[from]];
      return { ...s, [profile]: { ...s[profile], order } };
    });
  return (
    <section className="layout-editor">
      <div className="profile-tabs" aria-label="Indeling per apparaat">
        {(["phone", "tablet"] as const).map((p) => (
          <button
            key={p}
            aria-pressed={p === profile}
            onClick={() => setProfile(p)}
          >
            {p === "phone" ? <Smartphone size={16} /> : <Tablet size={16} />}{" "}
            {p === "phone" ? "Telefoon" : "Tablet"}
            {p === activeProfile && <small>Dit scherm</small>}
          </button>
        ))}
      </div>
      <fieldset>
        <legend>Hoe compact wil je het?</legend>
        <div className="density-options">
          {(
            [
              { id: "roomy", title: "Ruim", description: "Grotere tegels" },
              { id: "normal", title: "Normaal", description: "Mooi in balans" },
              { id: "compact", title: "Compact", description: "Meer in beeld" },
            ] as const
          ).map((d) => (
            <label key={d.id}>
              <input
                type="radio"
                name="density"
                value={d.id}
                checked={current.density === d.id}
                onChange={() =>
                  setSettings((s) => ({
                    ...s,
                    [profile]: { ...s[profile], density: d.id },
                  }))
                }
              />
              <span>
                {d.title}
                <small>{d.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="editor-heading">
        <h3>Wat staat er op Home?</h3>
        <span>Volgorde & zichtbaarheid</span>
      </div>
      <div className="widget-options">
        {current.order.map((id, index) => (
          <div
            className={`widget-option ${current.hidden.includes(id) ? "is-hidden" : ""}`}
            key={id}
          >
            <label>
              <input
                type="checkbox"
                aria-label={`Toon ${widgetNames[id]} op Home`}
                checked={!current.hidden.includes(id)}
                onChange={() =>
                  setSettings((s) => ({
                    ...s,
                    [profile]: {
                      ...s[profile],
                      hidden: s[profile].hidden.includes(id)
                        ? s[profile].hidden.filter((v) => v !== id)
                        : [...s[profile].hidden, id],
                    },
                  }))
                }
              />
              <span>{widgetNames[id]}</span>
            </label>
            <div>
              <button
                className="icon-button"
                aria-label={`Verplaats ${widgetNames[id]} omhoog`}
                disabled={index === 0}
                onClick={() => move(id, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={`Verplaats ${widgetNames[id]} omlaag`}
                disabled={index === current.order.length - 1}
                onClick={() => move(id, 1)}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="editor-note">
        Alles wordt direct bewaard op dit apparaat. Passen niet alle tegels? Dan
        verschijnen er extra pagina’s in plaats van een lange scrollpagina.
        Uitgebreide bediening en instellingen mogen wel scrollen.
      </p>
      <button
        className="text-button"
        onClick={() =>
          setSettings((s) => ({ ...s, [profile]: defaultProfile() }))
        }
      >
        <RotateCcw size={14} /> Standaardindeling herstellen
      </button>
    </section>
  );
}
