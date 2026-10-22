// Los datos de la guía: una serie terminada y todos sus episodios, en una sola llamada a TVmaze.
// TVmaze es gratis, no pide key y exige atribución (CC BY-SA): https://www.tvmaze.com/api
import type { Episode, Series } from "./series.ts";

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nameOf = (value: unknown) => (isRecord(value) && typeof value.name === "string" ? value.name : null);

/** La versión "medium" de una imagen de TVmaze, solo si es https. */
const httpsImage = (value: unknown) =>
  isRecord(value) && typeof value.medium === "string" && value.medium.startsWith("https://") ? value.medium : null;

/**
 * Se queda con lo que usa la guía y descarta los episodios que no tienen la forma esperada. La
 * respuesta viene de un tercero: si cambia, mejor perder una celda que romper el build.
 */
export function parseSeries(json: unknown): Series {
  if (!isRecord(json) || typeof json.id !== "number" || typeof json.name !== "string") {
    throw new Error("TVmaze: se esperaba un programa");
  }
  const embedded = isRecord(json._embedded) ? json._embedded.episodes : undefined;
  if (!Array.isArray(embedded)) throw new Error("TVmaze: la respuesta no trae los episodios (falta embed=episodes)");
  const image = isRecord(json.image) && typeof json.image.medium === "string" ? json.image.medium : "";
  const episodes = embedded.flatMap((item): Episode[] => {
    if (!isRecord(item) || typeof item.name !== "string") return [];
    // Los especiales no tienen número: no entran en la grilla de temporadas.
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
    // Las series de TV tienen network; las de streaming, webChannel.
    network: nameOf(json.network) ?? nameOf(json.webChannel),
    ...(image.startsWith("https://") && { image }),
    ...(genres.length > 0 && { genres }),
    episodes,
  };
}

/** Pide una serie con todos sus episodios. */
export async function fetchSeries(id: number, { fetch: get = fetch, timeoutMs = 10_000 } = {}): Promise<Series> {
  const url = `${TVMAZE_API}/shows/${id}?embed=episodes`;
  const response = await get(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`TVmaze: HTTP ${response.status} al pedir ${url}`);
  return parseSeries(await response.json());
}
