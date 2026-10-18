import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// A complete offline demo: no server, installation or external assets required.
export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: "standalone-favicon",
      transformIndexHtml(html) {
        return html.replace(/<link\s+rel="icon"[^>]*>/g, "");
      },
    },
  ],
  build: { outDir: "dist-standalone" },
});
