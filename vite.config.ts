import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { version } from "./package.json";

export default defineConfig(({ command, mode }) => ({
  base: "./",
  define: {
    __PWA_ENABLED__: command === "build" && mode !== "android",
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    mode !== "android" &&
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        injectRegister: false,
        registerType: "prompt",
        manifest: {
          id: "./",
          name: "Mijn Woning",
          short_name: "Mijn Woning",
          description:
            "Jouw huis, in harmonie. Persoonlijk smart-homedashboard met offline demo.",
          lang: "nl",
          start_url: "./",
          scope: "./",
          display: "standalone",
          background_color: "#100f0e",
          theme_color: "#100f0e",
          categories: ["lifestyle", "utilities"],
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,svg,png,webp,woff,woff2,webmanifest}"],
        },
      }),
  ],
  build: { outDir: mode === "android" ? "dist-android" : "dist" },
}));
