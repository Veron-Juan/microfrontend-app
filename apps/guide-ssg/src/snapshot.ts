// Saves the show to snapshot.json: it's what the build publishes if TVmaze doesn't respond. Since the
// show has ended, the copy doesn't go stale; it only needs regenerating when GUIDE_SHOW_ID changes.
//
//   npm run snapshot -w guide-ssg
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "./config.ts";
import { seriesProblems } from "./series.ts";
import { fetchSeries } from "./tvmaze.ts";

const series = await fetchSeries(config.showId);
const problems = seriesProblems(series);
if (problems.length > 0) throw new Error(`The show isn't suitable for the guide:\n- ${problems.join("\n- ")}`);

const out = new URL("./snapshot.json", import.meta.url);
await writeFile(out, `${JSON.stringify(series, null, 2)}\n`);
console.info(`guide-ssg: ${series.name}, ${series.episodes.length} episodes → ${fileURLToPath(out)}`);
