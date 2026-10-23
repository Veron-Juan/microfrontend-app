import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { registerFederatedRemotes } from "./mfe/federation.ts";
import { loadRegistry } from "./mfe/registry.ts";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Falta el elemento #root en index.html");

// Arranque del shell: primero averigua dónde vive cada remote (discovery), después los registra
// en Module Federation y recién entonces monta la página.
try {
  await loadRegistry(`${import.meta.env.BASE_URL}remotes.json`);
  registerFederatedRemotes();
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  // Sin discovery no hay página que componer: se dice por qué en lugar de dejarla en blanco.
  root.textContent = `No se pudo arrancar el shell. ${error instanceof Error ? error.message : String(error)}`;
  throw error;
}
