// Entry point for the "CDN": serves what the build generated, with ETags and caching.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { config } from "./config.ts";
import { createStaticHandler, type BuildMeta } from "./static.ts";

async function readMeta(): Promise<BuildMeta> {
  try {
    return JSON.parse(await readFile(join(config.outDir, "build.json"), "utf8")) as BuildMeta;
  } catch {
    console.warn("guide-ssg: there's no dist/build.json; did you run `npm run build`?");
    return {};
  }
}

const server = createServer(createStaticHandler(config.outDir, await readMeta()));
server.listen(config.port, () => {
  console.info(`guide-ssg (SSG) serving dist/ on http://localhost:${config.port}`);
});

function shutdown(signal: NodeJS.Signals) {
  console.info(`guide-ssg: ${signal} received, shutting down…`);
  server.close(() => process.exit(0));
  // If a connection doesn't close in time, exit anyway.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
