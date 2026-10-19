import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

// Remote "player": lo construye y despliega su propio equipo.
// Expone un único módulo; el shell lo descarga en runtime desde remoteEntry.js.
export default defineConfig({
  base: process.env.PUBLIC_URL ?? "http://localhost:5002/",
  plugins: [
    react(),
    federation({
      name: "player",
      dts: false,
      filename: "remoteEntry.js",
      manifest: true,
      exposes: { "./Player": "./src/Player.jsx" },
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
      },
    }),
  ],
  server: { port: 5002, cors: true, origin: process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:5002" },
  preview: { port: 5002, cors: true },
  build: { target: "esnext", modulePreload: false, cssCodeSplit: false },
});
