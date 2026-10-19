import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

// Dónde vive cada app. En producción cada URL es un deploy independiente (otro dominio, otro CDN).
const CATALOG = process.env.CATALOG_URL ?? "http://localhost:5001/";
const PLAYER = process.env.PLAYER_URL ?? "http://localhost:5002/";

// El shell es el "host": declara qué remotes existen y qué dependencias comparte con ellos.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "shell",
      dts: false,
      // En la vista previa estática las URLs son relativas: los remotes se registran en runtime (remotes.jsx).
      remotes: process.env.PREVIEW ? {} : {
        catalog: { type: "module", name: "catalog", entry: CATALOG + "remoteEntry.js", entryGlobalName: "catalog", shareScope: "default" },
        player: { type: "module", name: "player", entry: PLAYER + "remoteEntry.js", entryGlobalName: "player", shareScope: "default" },
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
      },
    }),
  ],
  base: process.env.SHELL_BASE ?? "/",
  define: {
    __PREVIEW__: JSON.stringify(!!process.env.PREVIEW),
    __URLS__: JSON.stringify({
      shell: process.env.SHELL_URL ?? "http://localhost:5000/",
      catalog: CATALOG,
      player: PLAYER,
      news: process.env.NEWS_URL ?? "http://localhost:5003/",
      guide: process.env.GUIDE_URL ?? "http://localhost:5004/",
    }),
  },
  server: { port: 5000 },
  preview: { port: 5000 },
  build: { target: "esnext" },
});
