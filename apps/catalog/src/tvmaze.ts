// The real catalog: TVmaze (https://www.tvmaze.com/api), free, keyless and with CORS, so the
// browser queries it directly. It asks for attribution (CC BY-SA). We only use names, genres and
// images: never the summaries' HTML.
import type { Show } from "@mfe/contracts";

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

/** How many titles the catalog shows. */
export const SHOW_COUNT = 8;

// TVmaze's genres and formats are already readable labels; only a couple read better renamed.
const LABELS: Readonly<Record<string, string>> = {
  "Science-Fiction": "Sci-Fi",
  Scripted: "Series",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The kind the catalog shows: the first genre, or the format if it has no genres. */
function kindOf(genres: unknown, type: unknown): string {
  const genre = Array.isArray(genres) && typeof genres[0] === "string" ? genres[0] : null;
  if (genre) return LABELS[genre] ?? genre;
  return typeof type === "string" ? (LABELS[type] ?? type) : "Series";
}

/** Turns a TVmaze show into a catalog title, or null if it's missing the essentials. */
export function toShow(json: unknown): Show | null {
  if (!isRecord(json) || typeof json.id !== "number" || typeof json.name !== "string") return null;
  const runtime = [json.averageRuntime, json.runtime].find((value) => typeof value === "number" && value > 0);
  const image = isRecord(json.image) && typeof json.image.medium === "string" ? json.image.medium : "";
  return {
    id: `tvmaze-${json.id}`,
    title: json.name,
    kind: kindOf(json.genres, json.type),
    length: ((runtime as number | undefined) ?? 30) * 60,
    // A stable hue per show, for when there's no image.
    hue: (json.id * 47) % 360,
    tvmazeId: json.id,
    ...(image.startsWith("https://") && { image }),
  };
}

const weightOf = (json: unknown) => (isRecord(json) && typeof json.weight === "number" ? json.weight : 0);

/** The most popular shows from the first page of TVmaze's index. */
export function popularShows(json: unknown, count = SHOW_COUNT): Show[] {
  if (!Array.isArray(json)) throw new Error("TVmaze: expected a list of shows");
  return [...json]
    .sort((a, b) => weightOf(b) - weightOf(a))
    .map(toShow)
    .filter((show) => show !== null)
    .slice(0, count);
}

/** The results of /search/shows, in TVmaze's relevance order. */
export function searchResults(json: unknown, count = SHOW_COUNT): Show[] {
  if (!Array.isArray(json)) throw new Error("TVmaze: expected a list of results");
  return json
    .map((result) => (isRecord(result) ? toShow(result.show) : null))
    .filter((show) => show !== null)
    .slice(0, count);
}

async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${TVMAZE_API}${path}`, { signal });
  if (!response.ok) throw new Error(`TVmaze: HTTP ${response.status}`);
  return response.json();
}

/** What the catalog shows when it opens. */
export async function fetchPopularShows(signal?: AbortSignal): Promise<Show[]> {
  return popularShows(await getJson("/shows?page=0", signal));
}

/** Searches shows by name. */
export async function searchShows(query: string, signal?: AbortSignal): Promise<Show[]> {
  return searchResults(await getJson(`/search/shows?q=${encodeURIComponent(query)}`, signal));
}
