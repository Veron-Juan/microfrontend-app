// Static Site Generation: este script corre UNA vez, en CI, antes del deploy.
// Lo que sale de aquí son archivos .html que cualquier CDN puede servir.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { compileTailwind } from "@mfe/design-tokens/compile";
import { config } from "./config.ts";
import { renderGuideFragment, standalonePage } from "./render.tsx";
import { CHANNELS, formatBuiltAt, HOURS, scheduleProblems } from "./schedule.ts";

const t0 = performance.now();

// Mejor fallar en el build que publicar una grilla rota.
const problems = scheduleProblems(CHANNELS, HOURS);
if (problems.length > 0) throw new Error(`La grilla tiene errores:\n- ${problems.join("\n- ")}`);

const cssPath = (name: string) => fileURLToPath(new URL(name, import.meta.url));
const [css, standaloneCss] = await Promise.all([
  compileTailwind(cssPath("./guide.css")),
  compileTailwind(cssPath("./standalone.css")),
]);

const builtAt = new Date();
const props = { built: formatBuiltAt(builtAt), channels: CHANNELS, hours: HOURS };
// Un primer render para medir cuánto tarda la generación; el definitivo muestra ese tiempo.
renderGuideFragment(css, { ...props, buildMs: 0 });
const buildMs = Math.max(1, Math.round(performance.now() - t0));
const fragment = renderGuideFragment(css, { ...props, buildMs });

const files = {
  "fragment/guide.html": fragment,
  "index.html": standalonePage(fragment, standaloneCss),
};
await mkdir(join(config.outDir, "fragment"), { recursive: true });
await Promise.all(Object.entries(files).map(([name, html]) => writeFile(join(config.outDir, name), html)));
const meta = {
  name: "guide-ssg",
  version: config.version,
  builtAt: builtAt.toISOString(),
  buildMs,
  files: Object.keys(files),
};
await writeFile(join(config.outDir, "build.json"), JSON.stringify(meta, null, 2));

console.info(
  `guide-ssg: ${Object.keys(files).length} páginas generadas en ${buildMs} ms (CSS ${css.length} B) → dist/`,
);
