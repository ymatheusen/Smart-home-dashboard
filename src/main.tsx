import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PwaProvider } from "./pwa/PwaProvider";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "./styles.css";
import "./dashboard.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PwaProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </PwaProvider>
  </React.StrictMode>,
);
