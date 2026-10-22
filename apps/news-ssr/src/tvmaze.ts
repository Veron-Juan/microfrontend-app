// Estrenos del día en streaming desde TVmaze (https://www.tvmaze.com/api): gratis, sin key y con
// atribución obligatoria (CC BY-SA). Solo usamos nombres y carátulas https; nunca el HTML de los resúmenes.

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

export interface Premiere {
  /** Id del programa en TVmaze. */
  id: number;
  show: string;
  /** "T2 · estreno" o "T2 E5". */
  episode: string;
  /** Plataforma de streaming ("Netflix", "Prime Video"…). */
  platform: string;
  /** Carátula chica (https), o null si TVmaze no tiene. */
  image: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Convierte /schedule/web en la lista de novedades: un episodio por programa, primero los estrenos
 * de temporada y después los más populares. Descarta lo que no tiene la forma esperada.
 */
export function parseWebSchedule(json: unknown, count: number): Premiere[] {
  if (!Array.isArray(json)) throw new Error("TVmaze: se esperaba una lista de episodios");
  const candidates = json.flatMap((item) => {
    if (!isRecord(item) || !isRecord(item._embedded) || !isRecord(item._embedded.show)) return [];
    const { show } = item._embedded;
    if (typeof show.id !== "number" || typeof show.name !== "string") return [];
    const season = typeof item.season === "number" ? item.season : null;
    const number = typeof item.number === "number" ? item.number : null;
    const platform = isRecord(show.webChannel) && typeof show.webChannel.name === "string" ? show.webChannel.name : "";
    const premiere = number === 1;
    const episode =
      season === null ? "" : premiere ? `T${season} · estreno` : `T${season}${number ? ` E${number}` : ""}`;
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

/** Los episodios que salen hoy (AAAA-MM-DD) en plataformas de streaming. */
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
