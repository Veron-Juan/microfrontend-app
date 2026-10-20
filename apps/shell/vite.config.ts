import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";

// El shell es el "host". No declara aquí las URLs de sus remotes: las lee al arrancar de
// public/remotes.json (el discovery), así el mismo build sirve para todos los entornos.
// Lo que sí fija en el build es qué dependencias comparte con ellos.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "shell",
      dts: false,
      remotes: {},
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
      },
    }),
  ],
  base: process.env.SHELL_BASE ?? "/",
  server: { port: 5000, strictPort: true },
  preview: { port: 5000, strictPort: true },
  build: { target: "esnext" },
});
