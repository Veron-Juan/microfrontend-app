// Entry point: compiles the CSS once, starts the server and shuts it down gracefully.
import { fileURLToPath } from "node:url";
import { compileTailwind } from "@mfe/design-tokens/compile";
import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { createLimiter } from "./limits.ts";
import { createLiveData, liveSources } from "./live-data.ts";

const cssPath = (name: string) => fileURLToPath(new URL(name, import.meta.url));

// A single compilation at startup: the classes don't change between requests, so it isn't paid for
// on every render.
const [css, standaloneCss] = await Promise.all([
  compileTailwind(cssPath("./news.css")),
  compileTailwind(cssPath("./standalone.css")),
]);

const fetchData = createLiveData(liveSources({ sportsDbKey: config.sportsDbKey }));
const app = createApp({ version: config.version, css, standaloneCss, fetchData, limit: createLimiter(config.limits) });
const server = app.listen(config.port, () => {
  console.info(`news-ssr (SSR) listening on http://localhost:${config.port} · CSS ${css.length} B`);
  // Warms up the cache: that way the first visitor doesn't wait for the external APIs.
  void fetchData(Date.now());
});

function shutdown(signal: NodeJS.Signals) {
  console.info(`news-ssr: ${signal} received, shutting down…`);
  server.close(() => process.exit(0));
  // If a connection doesn't close in time, exit anyway.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
