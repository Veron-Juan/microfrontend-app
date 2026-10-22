// Guarda la serie en snapshot.json: es lo que publica el build si TVmaze no responde. Como la serie
// terminó, la copia no envejece; solo hay que regenerarla al cambiar GUIDE_SHOW_ID.
//
//   npm run snapshot -w guide-ssg
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "./config.ts";
import { seriesProblems } from "./series.ts";
import { fetchSeries } from "./tvmaze.ts";

const series = await fetchSeries(config.showId);
const problems = seriesProblems(series);
if (problems.length > 0) throw new Error(`La serie no sirve para la guía:\n- ${problems.join("\n- ")}`);

const out = new URL("./snapshot.json", import.meta.url);
await writeFile(out, `${JSON.stringify(series, null, 2)}\n`);
console.info(`guide-ssg: ${series.name}, ${series.episodes.length} episodios → ${fileURLToPath(out)}`);
