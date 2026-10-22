// Static Site Generation: este script corre UNA vez, en CI, antes del deploy.
// Pide los datos (una serie terminada y sus episodios, en TVmaze), los valida y los convierte en
// archivos .html que cualquier CDN puede servir. Después nadie vuelve a ejecutar código por cada
// visita. Como la serie terminó, sus datos no cambian: no hace falta reconstruir la guía cada día,
// solo cuando cambia el código.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { compileTailwind } from "@mfe/design-tokens/compile";
import { config } from "./config.ts";
import type { GuideSource } from "./Guide.tsx";
import { renderGuideFragment, standalonePage } from "./render.tsx";
import { formatBuiltAt, seriesProblems, type Series } from "./series.ts";
import snapshot from "./snapshot.json" with { type: "json" };
import { headersFile } from "./static.ts";
import { fetchSeries, TVMAZE_SITE } from "./tvmaze.ts";

const t0 = performance.now();
const builtAt = new Date();

/**
 * La serie, pedida a TVmaze. Si no responde, se usa la copia guardada en el repo (snapshot.json):
 * como la serie terminó, la copia tiene los mismos datos y el build no depende de la red.
 */
async function loadSeries(): Promise<{ series: Series; source: GuideSource }> {
  const url = `${TVMAZE_SITE}/shows/${config.showId}`;
  try {
    // Un reintento: un build no debería depender de que la primera llamada a un tercero salga bien.
    const get = () => fetchSeries(config.showId);
    return { series: await get().catch(get), source: { name: "TVmaze", url, detail: "pedidos una vez, en el build" } };
  } catch (error) {
    if (snapshot.id !== config.showId) throw error;
    console.warn(`guide-ssg: TVmaze no respondió (${error instanceof Error ? error.message : String(error)}).`);
    console.warn("guide-ssg: se usa la copia guardada en snapshot.json.");
    const series: Series = snapshot;
    return { series, source: { name: "TVmaze", url, detail: "copia guardada en el repo (la API no respondió)" } };
  }
}

const { series, source } = await loadSeries();
const tData = performance.now();

// Mejor fallar en el build que publicar una guía rota (o de una serie que todavía cambia).
const problems = seriesProblems(series);
if (problems.length > 0) throw new Error(`La guía tiene errores:\n- ${problems.join("\n- ")}`);

const cssPath = (name: string) => fileURLToPath(new URL(name, import.meta.url));
const [css, standaloneCss] = await Promise.all([
  compileTailwind(cssPath("./guide.css")),
  compileTailwind(cssPath("./standalone.css")),
]);

const props = { built: formatBuiltAt(builtAt), series, source };
// Un primer render para medir cuánto tarda la generación; el definitivo muestra ese tiempo.
renderGuideFragment(css, { ...props, buildMs: 0 });
const buildMs = Math.max(1, Math.round(performance.now() - t0));
const fragment = renderGuideFragment(css, { ...props, buildMs });

const meta = { name: "guide-ssg", version: config.version, builtAt: builtAt.toISOString() };
const files = {
  "fragment/guide.html": fragment,
  "index.html": standalonePage(fragment, standaloneCss),
};
await mkdir(join(config.outDir, "fragment"), { recursive: true });
await Promise.all([
  ...Object.entries(files).map(([name, html]) => writeFile(join(config.outDir, name), html)),
  // Las mismas cabeceras que pone serve.ts, para un CDN real (Cloudflare Pages o Netlify).
  writeFile(join(config.outDir, "_headers"), headersFile(meta)),
  writeFile(
    join(config.outDir, "build.json"),
    JSON.stringify(
      { ...meta, buildMs, dataMs: Math.round(tData - t0), source: source.detail, files: Object.keys(files) },
      null,
      2,
    ),
  ),
]);

console.info(
  `guide-ssg: ${Object.keys(files).length} páginas de ${series.name} generadas en ${buildMs} ms (CSS ${css.length} B) → dist/`,
);
