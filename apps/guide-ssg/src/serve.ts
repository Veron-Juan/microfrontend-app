// Punto de entrada del "CDN": sirve lo que generó el build, con ETag y caché.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { config } from "./config.ts";
import { createStaticHandler, type BuildMeta } from "./static.ts";

async function readMeta(): Promise<BuildMeta> {
  try {
    return JSON.parse(await readFile(join(config.outDir, "build.json"), "utf8")) as BuildMeta;
  } catch {
    console.warn("guide-ssg: no hay dist/build.json; ¿corriste `npm run build`?");
    return {};
  }
}

const server = createServer(createStaticHandler(config.outDir, await readMeta()));
server.listen(config.port, () => {
  console.info(`guide-ssg (SSG) sirviendo dist/ en http://localhost:${config.port}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.info(`guide-ssg: ${signal} recibido, cerrando…`);
  server.close(() => process.exit(0));
  // Si alguna conexión no se cierra a tiempo, salimos igual.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
