import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";

// The shell is the "host". It doesn't declare its remotes' URLs here: it reads them at startup
// from public/remotes.json (the discovery), so the same build works for every environment.
// What it does fix at build time is which dependencies it shares with them.
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
