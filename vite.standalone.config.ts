import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { version } from "./package.json";

// A complete offline demo: no server, installation or external assets required.
export default defineConfig({
  publicDir: false,
  define: { __PWA_ENABLED__: false, __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: "standalone-favicon",
      transformIndexHtml(html) {
        return html.replace(
          /<link\s+rel="(?:icon|apple-touch-icon)"[^>]*>/g,
          "",
        );
      },
    },
  ],
  build: { outDir: "dist-standalone" },
});
