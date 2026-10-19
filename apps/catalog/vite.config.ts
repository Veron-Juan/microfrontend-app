import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";

// Remote "catalog": lo construye y despliega su propio equipo.
// Expone un único módulo; el shell lo descarga en runtime desde remoteEntry.js.
export default defineConfig({
  base: process.env.PUBLIC_URL ?? "http://localhost:5001/",
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "catalog",
      dts: false,
      filename: "remoteEntry.js",
      manifest: true,
      exposes: { "./Catalog": "./src/Catalog.tsx" },
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
      },
    }),
  ],
  server: { port: 5001, cors: true, origin: process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:5001" },
  preview: { port: 5001, cors: true },
  build: { target: "esnext", modulePreload: false, cssCodeSplit: false },
});
