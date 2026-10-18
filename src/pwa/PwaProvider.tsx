import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
interface PwaState {
  enabled: boolean;
  online: boolean;
  offlineReady: boolean;
  installed: boolean;
  canInstall: boolean;
  installing: boolean;
  waiting: boolean;
  dismissed: boolean;
  checking: boolean;
  message: string;
  install(): Promise<void>;
  checkUpdates(): Promise<void>;
  applyUpdate(): void;
  dismissUpdate(): void;
}
const PwaContext = createContext<PwaState | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installing, setInstalling] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const pendingWorker = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const captureInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setInstalling(false);
    };
    const display = window.matchMedia("(display-mode: standalone)");
    const updateDisplay = () =>
      setInstalled(
        display.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("beforeinstallprompt", captureInstall);
    window.addEventListener("appinstalled", onInstalled);
    display.addEventListener("change", updateDisplay);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("beforeinstallprompt", captureInstall);
      window.removeEventListener("appinstalled", onInstalled);
      display.removeEventListener("change", updateDisplay);
    };
  }, []);

  useEffect(() => {
    if (!__PWA_ENABLED__) return;
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      setMessage(
        "Offline opslaan is niet beschikbaar in deze browser. Gebruik de HTTPS-website in Chrome of Safari.",
      );
      return;
    }
    let mounted = true;
    let hadController = Boolean(navigator.serviceWorker.controller);
    const cleanups: (() => void)[] = [];
    const offerUpdate = (worker: ServiceWorker) => {
      if (!mounted) return;
      pendingWorker.current = worker;
      setWaiting(true);
      setDismissed(false);
    };
    const onControllerChange = () => {
      // First activation prepares offline use. A later activation reopens all
      // controlled tabs on one coherent version; saved preferences stay intact.
      if (hadController) window.location.reload();
      else {
        hadController = true;
        if (mounted) setOfflineReady(true);
      }
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    const base = new URL(import.meta.env.BASE_URL, window.location.href);
    void navigator.serviceWorker
      .register(new URL("sw.js", base), {
        scope: base.href,
        updateViaCache: "none",
      })
      .then((reg) => {
        if (!mounted) return;
        registration.current = reg;
        if (reg.waiting) offerUpdate(reg.waiting);
        const watchInstalling = () => {
          const worker = reg.installing;
          if (!worker) return;
          const onStateChange = () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              offerUpdate(reg.waiting || worker);
          };
          worker.addEventListener("statechange", onStateChange);
          cleanups.push(() =>
            worker.removeEventListener("statechange", onStateChange),
          );
          onStateChange();
        };
        reg.addEventListener("updatefound", watchInstalling);
        cleanups.push(() =>
          reg.removeEventListener("updatefound", watchInstalling),
        );
        watchInstalling();
        void navigator.serviceWorker.ready.then(() => {
          if (mounted) setOfflineReady(true);
        });
        const check = () => {
          if (navigator.onLine && document.visibilityState === "visible")
            void reg.update().catch(() => {});
        };
        window.addEventListener("online", check);
        document.addEventListener("visibilitychange", check);
        const interval = window.setInterval(check, 60 * 60 * 1000);
        cleanups.push(() => {
          window.removeEventListener("online", check);
          document.removeEventListener("visibilitychange", check);
          window.clearInterval(interval);
        });
      })
      .catch(() => {
        if (mounted)
          setMessage(
            "Offline opslaan is niet gelukt. Controleer je verbinding en browseropslag en open de app opnieuw.",
          );
      });
    return () => {
      mounted = false;
      cleanups.forEach((clean) => clean());
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  const install = async () => {
    if (!prompt || installing) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "Installatie aangevraagd. Open Mijn Woning daarna via het nieuwe app-icoon."
          : "Je kunt de app later alsnog installeren.",
      );
      setPrompt(null);
    } catch {
      setMessage(
        "Installeren lukte niet. Probeer het via het menu van je browser.",
      );
    } finally {
      setInstalling(false);
    }
  };
  const checkUpdates = async () => {
    if (!navigator.onLine) {
      setMessage(
        "Je bent offline. Controleer opnieuw zodra je verbinding hebt.",
      );
      return;
    }
    if (!registration.current) {
      setMessage(
        "De app wordt nog klaargezet. Probeer het over enkele seconden opnieuw.",
      );
      return;
    }
    setChecking(true);
    try {
      await registration.current.update();
      setMessage("Updatecontrole uitgevoerd.");
    } catch {
      setMessage(
        "Updates controleren is nu niet gelukt. Je huidige versie blijft beschikbaar.",
      );
    } finally {
      setChecking(false);
    }
  };
  const applyUpdate = () => {
    const worker = registration.current?.waiting || pendingWorker.current;
    if (worker?.state === "installed")
      worker.postMessage({ type: "SKIP_WAITING" });
    else
      setMessage(
        "De nieuwe versie wordt nog klaargezet. Probeer het zo opnieuw.",
      );
  };

  return (
    <PwaContext.Provider
      value={{
        enabled: __PWA_ENABLED__,
        online,
        offlineReady,
        installed,
        canInstall: Boolean(prompt) && !installed,
        installing,
        waiting,
        dismissed,
        checking,
        message,
        install,
        checkUpdates,
        applyUpdate,
        dismissUpdate: () => setDismissed(true),
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("PwaProvider ontbreekt");
  return context;
}
