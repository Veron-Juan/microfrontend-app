// Today's streaming premieres from TVmaze (https://www.tvmaze.com/api): free, keyless and with
// mandatory attribution (CC BY-SA). We only use names and https posters; never the summaries' HTML.

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

export interface Premiere {
  /** The show's TVmaze id. */
  id: number;
  show: string;
  /** "S2 · premiere" or "S2 E5". */
  episode: string;
  /** Streaming platform ("Netflix", "Prime Video"…). */
  platform: string;
  /** Small poster (https), or null if TVmaze has none. */
  image: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Turns /schedule/web into the news list: one episode per show, season premieres first and then
 * the most popular. Drops anything without the expected shape.
 */
export function parseWebSchedule(json: unknown, count: number): Premiere[] {
  if (!Array.isArray(json)) throw new Error("TVmaze: expected a list of episodes");
  const candidates = json.flatMap((item) => {
    if (!isRecord(item) || !isRecord(item._embedded) || !isRecord(item._embedded.show)) return [];
    const { show } = item._embedded;
    if (typeof show.id !== "number" || typeof show.name !== "string") return [];
    const season = typeof item.season === "number" ? item.season : null;
    const number = typeof item.number === "number" ? item.number : null;
    const platform = isRecord(show.webChannel) && typeof show.webChannel.name === "string" ? show.webChannel.name : "";
    const premiere = number === 1;
    const episode =
      season === null ? "" : premiere ? `S${season} · premiere` : `S${season}${number ? ` E${number}` : ""}`;
    const medium = isRecord(show.image) && typeof show.image.medium === "string" ? show.image.medium : "";
    const image = medium.startsWith("https://") ? medium : null;
    return [{ id: show.id, show: show.name, episode, platform, image, premiere, weight: Number(show.weight) || 0 }];
  });
  const seen = new Set<number>();
  return candidates
    .sort((a, b) => Number(b.premiere) - Number(a.premiere) || b.weight - a.weight || a.show.localeCompare(b.show))
    .filter((candidate) => !seen.has(candidate.id) && seen.add(candidate.id))
    .slice(0, count)
    .map(({ id, show, episode, platform, image }) => ({ id, show, episode, platform, image }));
}

/** The episodes coming out today (YYYY-MM-DD) on streaming platforms. */
export async function fetchPremieres(
  date: string,
  count: number,
  { fetch: get = fetch, timeoutMs = 2500 } = {},
): Promise<Premiere[]> {
  const url = `${TVMAZE_API}/schedule/web?date=${date}`;
  const response = await get(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`TVmaze: HTTP ${response.status}`);
  return parseWebSchedule(await response.json(), count);
}
