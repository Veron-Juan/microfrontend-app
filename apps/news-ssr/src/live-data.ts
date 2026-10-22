// Los datos en vivo del fragmento: partidos del día (TheSportsDB) y novedades de streaming
// (TVmaze). Separado del render para poder probarlo sin servidor y sin red.
import { cached, type Cached } from "./cache.ts";
import { fetchMatches, type Match } from "./sportsdb.ts";
import { fetchPremieres, type Premiere } from "./tvmaze.ts";

/** Lo que llegó de una API para este render. */
export interface Feed<T> {
  items: T[];
  /** false si la API falló y no había nada guardado: el fragmento muestra un aviso en su lugar. */
  ok: boolean;
  /** Segundos desde que se pidieron estos datos a la API (0 si se acaban de pedir). */
  age: number;
}

export interface LiveData {
  matches: Feed<Match>;
  premieres: Feed<Premiere>;
}

/** Cuántos partidos y novedades muestra el fragmento. */
export const MATCH_COUNT = 3;
export const PREMIERE_COUNT = 3;

/** Cuánto se reutiliza una respuesta antes de volver a pedirla. */
export const DATA_TTL_MS = 60_000;

/** Una consulta ya envuelta en la caché. */
export type Source<T> = () => Promise<Cached<T[]>>;

export interface Sources {
  matches: Source<Match>;
  premieres: Source<Premiere>;
}

/** La fecha UTC de hoy, como la esperan las dos APIs. */
const today = () => new Date().toISOString().slice(0, 10);

/** Las fuentes reales, cada una con su caché. */
export function liveSources({ sportsDbKey }: { sportsDbKey?: string } = {}): Sources {
  return {
    matches: cached(async () => {
      const matches = await fetchMatches(today(), { key: sportsDbKey });
      return matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff)).slice(0, MATCH_COUNT);
    }, DATA_TTL_MS),
    premieres: cached(() => fetchPremieres(today(), PREMIERE_COUNT), DATA_TTL_MS),
  };
}

async function toFeed<T>(source: Source<T>, now: number, onError: (error: unknown) => void): Promise<Feed<T>> {
  try {
    const { value, at } = await source();
    return { items: value, ok: true, age: Math.max(0, Math.round((now - at) / 1000)) };
  } catch (error) {
    onError(error);
    return { items: [], ok: false, age: 0 };
  }
}

/**
 * Pide las dos fuentes en paralelo. Si una falla, el fragmento sale igual con la otra: una API
 * caída degrada una sección, no tumba el render.
 */
export function createLiveData(
  sources: Sources,
  onError: (error: unknown) => void = (error) => console.warn("news-ssr: una API no respondió", error),
) {
  return async (now: number): Promise<LiveData> => {
    const [matches, premieres] = await Promise.all([
      toFeed(sources.matches, now, onError),
      toFeed(sources.premieres, now, onError),
    ]);
    return { matches, premieres };
  };
}
