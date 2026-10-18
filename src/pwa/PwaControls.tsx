import { useState } from "react";
import {
  Check,
  Download,
  RefreshCw,
  Smartphone,
  WifiOff,
  X,
} from "lucide-react";
import { usePwa } from "./PwaProvider";
import { isNativeAndroid } from "../hue/native";
import "./pwa.css";

export function PwaControls() {
  const pwa = usePwa();
  const [instructions, setInstructions] = useState(false);
  if (isNativeAndroid)
    return (
      <section className="pwa-settings">
        <div className="pwa-heading">
          <span className="device-icon">
            <Smartphone size={22} />
          </span>
          <div>
            <h3>Mijn Woning voor Android</h3>
            <p>Appbestanden zijn ingebouwd en openen zonder internet.</p>
          </div>
          <span className="pwa-version">v{__APP_VERSION__}</span>
        </div>
        <p className="pwa-demo-note">
          Hue kan lokaal live worden gekoppeld. De overige integraties blijven
          demo. Een nieuwe APK installeer je over deze versie heen.
        </p>
      </section>
    );
  return (
    <section className="pwa-settings" aria-label="App en offlinegebruik">
      <div className="pwa-heading">
        <span className="device-icon">
          <Smartphone size={22} />
        </span>
        <div>
          <h3>Jouw woning. Ook als app.</h3>
          <p>
            {pwa.installed
              ? "Mijn Woning is als app geopend."
              : "Een eigen icoon, zonder browserbalk."}
          </p>
        </div>
        <span className="pwa-version">v{__APP_VERSION__}</span>
      </div>
      <div
        className={`pwa-offline-status ${pwa.offlineReady ? "ready" : ""}`}
        role="status"
      >
        {!pwa.online ? <WifiOff size={15} /> : <Check size={15} />}
        <span>
          {!pwa.enabled
            ? "Installeren en offline opslaan werken op de gepubliceerde website."
            : pwa.offlineReady
              ? pwa.online
                ? "Gereed voor offlinegebruik"
                : "Je bent offline · je demo blijft beschikbaar"
              : pwa.message
                ? "Offlinegebruik is nog niet gereed"
                : "Offlinegebruik wordt voorbereid…"}
        </span>
      </div>
      {pwa.enabled && (
        <div className="pwa-actions">
          {!pwa.installed && (
            <button
              className="pwa-install"
              disabled={pwa.installing}
              onClick={() =>
                pwa.canInstall ? void pwa.install() : setInstructions((v) => !v)
              }
            >
              <Download size={16} />
              {pwa.installing
                ? "Installatie openen…"
                : pwa.canInstall
                  ? "App installeren"
                  : "Hoe installeer ik de app?"}
            </button>
          )}
          <button
            className="pwa-check"
            disabled={pwa.checking}
            onClick={() => void pwa.checkUpdates()}
          >
            <RefreshCw size={14} />
            {pwa.checking ? "Controleren…" : "Controleer op updates"}
          </button>
        </div>
      )}
      {instructions && (
        <div className="pwa-instructions">
          <strong>Op je Android-telefoon of tablet</strong>
          <p>
            Open deze website in Chrome. Tik op ⋮ →{" "}
            <b>Toevoegen aan startscherm</b> → <b>Installeren</b>. De precieze
            menutekst kan per versie verschillen.
          </p>
          <strong>Op je laptop</strong>
          <p>
            Gebruik het installatie-icoon in de adresbalk van Chrome, of kies
            installeren via het browsermenu.
          </p>
          <strong>Op iPhone of iPad</strong>
          <p>Open de website in Safari en kies Deel → Zet op beginscherm.</p>
          <small>
            Open de app één keer online en wacht op “Gereed voor
            offlinegebruik”. Daarna kun je de demo ook zonder internet openen.
          </small>
        </div>
      )}
      {pwa.waiting && (
        <div className="pwa-update-inline">
          <strong>Een nieuwe versie staat klaar</strong>
          <p>
            Bijwerken opent de app opnieuw. Je opgeslagen indeling en
            instellingen blijven bewaard.
          </p>
          <button onClick={pwa.applyUpdate}>
            <RefreshCw size={15} /> Bijwerken en heropenen
          </button>
        </div>
      )}
      {pwa.message && (
        <p className="pwa-message" role="status">
          {pwa.message}
        </p>
      )}
      <p className="pwa-demo-note">
        Alle bediening blijft demo. Instellingen en offline bestanden worden op
        dit apparaat bewaard.
      </p>
    </section>
  );
}

export function PwaUpdateNotice({ visible }: { visible: boolean }) {
  const pwa = usePwa();
  if (!visible || !pwa.waiting || pwa.dismissed) return null;
  return (
    <aside className="pwa-update-notice" aria-label="App-update">
      <div>
        <RefreshCw size={20} />
        <span>
          <strong>Een nieuwe versie staat klaar</strong>
          <small>Je instellingen blijven bewaard.</small>
        </span>
        <button
          className="icon-button"
          aria-label="Update later installeren"
          onClick={pwa.dismissUpdate}
        >
          <X size={17} />
        </button>
      </div>
      <button className="pwa-install" onClick={pwa.applyUpdate}>
        Bijwerken en heropenen
      </button>
    </aside>
  );
}
