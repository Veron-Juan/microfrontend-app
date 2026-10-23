// The guide's data: a show that has ended and all its episodes, in a single call to TVmaze.
// TVmaze is free, needs no key and requires attribution (CC BY-SA): https://www.tvmaze.com/api
import type { Episode, Series } from "./series.ts";

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nameOf = (value: unknown) => (isRecord(value) && typeof value.name === "string" ? value.name : null);

/** The "medium" version of a TVmaze image, only if it's https. */
const httpsImage = (value: unknown) =>
  isRecord(value) && typeof value.medium === "string" && value.medium.startsWith("https://") ? value.medium : null;

/**
 * Keeps what the guide uses and drops episodes without the expected shape. The response comes from
 * a third party: if it changes, better to lose a cell than to break the build.
 */
export function parseSeries(json: unknown): Series {
  if (!isRecord(json) || typeof json.id !== "number" || typeof json.name !== "string") {
    throw new Error("TVmaze: expected a show");
  }
  const embedded = isRecord(json._embedded) ? json._embedded.episodes : undefined;
  if (!Array.isArray(embedded)) throw new Error("TVmaze: the response has no episodes (missing embed=episodes)");
  const image = isRecord(json.image) && typeof json.image.medium === "string" ? json.image.medium : "";
  const episodes = embedded.flatMap((item): Episode[] => {
    if (!isRecord(item) || typeof item.name !== "string") return [];
    // Specials have no number: they don't go in the season grid.
    if (typeof item.season !== "number" || typeof item.number !== "number") return [];
    const rating = isRecord(item.rating) && typeof item.rating.average === "number" ? item.rating.average : null;
    const airdate = typeof item.airdate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.airdate) ? item.airdate : "";
    const still = httpsImage(item.image);
    return [
      { season: item.season, number: item.number, name: item.name, airdate, rating, ...(still && { image: still }) },
    ];
  });
  const genres = Array.isArray(json.genres) ? json.genres.filter((genre) => typeof genre === "string") : [];
  return {
    id: json.id,
    name: json.name,
    status: typeof json.status === "string" ? json.status : "Unknown",
    // TV shows have a network; streaming ones, a webChannel.
    network: nameOf(json.network) ?? nameOf(json.webChannel),
    ...(image.startsWith("https://") && { image }),
    ...(genres.length > 0 && { genres }),
    episodes,
  };
}

/** Fetches a show with all its episodes. */
export async function fetchSeries(id: number, { fetch: get = fetch, timeoutMs = 10_000 } = {}): Promise<Series> {
  const url = `${TVMAZE_API}/shows/${id}?embed=episodes`;
  const response = await get(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`TVmaze: HTTP ${response.status} fetching ${url}`);
  return parseSeries(await response.json());
}
