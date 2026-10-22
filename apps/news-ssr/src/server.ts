// Punto de entrada: compila el CSS una vez, levanta el servidor y lo cierra con orden.
import { fileURLToPath } from "node:url";
import { compileTailwind } from "@mfe/design-tokens/compile";
import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { createLimiter } from "./limits.ts";
import { createLiveData, liveSources } from "./live-data.ts";

const cssPath = (name: string) => fileURLToPath(new URL(name, import.meta.url));

// Una sola compilación al arrancar: las clases no cambian entre requests, así que no se paga
// en cada render.
const [css, standaloneCss] = await Promise.all([
  compileTailwind(cssPath("./news.css")),
  compileTailwind(cssPath("./standalone.css")),
]);

const fetchData = createLiveData(liveSources({ sportsDbKey: config.sportsDbKey }));
const app = createApp({ version: config.version, css, standaloneCss, fetchData, limit: createLimiter(config.limits) });
const server = app.listen(config.port, () => {
  console.info(`news-ssr (SSR) escuchando en http://localhost:${config.port} · CSS ${css.length} B`);
  // Precalienta la caché: así el primer visitante no espera a las APIs externas.
  void fetchData(Date.now());
});

function shutdown(signal: NodeJS.Signals) {
  console.info(`news-ssr: ${signal} recibido, cerrando…`);
  server.close(() => process.exit(0));
  // Si alguna conexión no se cierra a tiempo, salimos igual.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
