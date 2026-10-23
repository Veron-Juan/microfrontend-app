// Static Site Generation: this script runs ONCE, in CI, before the deploy.
// It fetches the data (a show that has ended and its episodes, from TVmaze), validates it and turns
// it into .html files any CDN can serve. After that, no code runs again per visit. Since the show
// has ended, its data doesn't change: the guide doesn't need rebuilding every day, only when the
// code changes.
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
 * The show, fetched from TVmaze. If it doesn't respond, the copy stored in the repo (snapshot.json)
 * is used: since the show has ended, the copy has the same data and the build doesn't depend on the network.
 */
async function loadSeries(): Promise<{ series: Series; source: GuideSource }> {
  const url = `${TVMAZE_SITE}/shows/${config.showId}`;
  try {
    // One retry: a build shouldn't depend on the first call to a third party going well.
    const get = () => fetchSeries(config.showId);
    return { series: await get().catch(get), source: { name: "TVmaze", url, detail: "fetched once, at build time" } };
  } catch (error) {
    if (snapshot.id !== config.showId) throw error;
    console.warn(`guide-ssg: TVmaze didn't respond (${error instanceof Error ? error.message : String(error)}).`);
    console.warn("guide-ssg: using the copy stored in snapshot.json.");
    const series: Series = snapshot;
    return { series, source: { name: "TVmaze", url, detail: "copy stored in the repo (the API didn't respond)" } };
  }
}

const { series, source } = await loadSeries();
const tData = performance.now();

// Better to fail the build than to publish a broken guide (or one for a show that still changes).
const problems = seriesProblems(series);
if (problems.length > 0) throw new Error(`The guide has errors:\n- ${problems.join("\n- ")}`);

const cssPath = (name: string) => fileURLToPath(new URL(name, import.meta.url));
const [css, standaloneCss] = await Promise.all([
  compileTailwind(cssPath("./guide.css")),
  compileTailwind(cssPath("./standalone.css")),
]);

const props = { built: formatBuiltAt(builtAt), series, source };
// A first render to measure how long generation takes; the final one shows that time.
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
  // The same headers serve.ts sets, for a real CDN (Cloudflare Pages or Netlify).
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
  `guide-ssg: ${Object.keys(files).length} pages for ${series.name} generated in ${buildMs} ms (CSS ${css.length} B) → dist/`,
);
