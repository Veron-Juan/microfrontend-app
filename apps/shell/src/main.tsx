import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { registerFederatedRemotes } from "./mfe/federation.ts";
import { loadRegistry } from "./mfe/registry.ts";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing the #root element");

// Shell startup: first find out where each remote lives (discovery), then register them
// with Module Federation, and only then mount the page.
try {
  await loadRegistry(`${import.meta.env.BASE_URL}remotes.json`);
  registerFederatedRemotes();
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  // Without discovery there is no page to compose: say why instead of leaving it blank.
  root.textContent = `The shell could not start. ${error instanceof Error ? error.message : String(error)}`;
  throw error;
}
