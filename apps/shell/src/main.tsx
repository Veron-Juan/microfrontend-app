import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { watchBus } from "./mfe/bus.ts";
import { registerFederatedRemotes } from "./mfe/federation.ts";
import "./styles.css";

// Antes de montar nada: el shell registra dónde vive cada remote y empieza a escuchar el bus.
registerFederatedRemotes();
watchBus();

const root = document.getElementById("root");
if (!root) throw new Error("Falta el elemento #root en index.html");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
