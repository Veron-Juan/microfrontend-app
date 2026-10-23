// The fragment's live data: today's matches (TheSportsDB) and streaming news (TVmaze).
// Kept apart from the render so it can be tested without a server or a network.
import { cached, type Cached } from "./cache.ts";
import { fetchMatches, type Match } from "./sportsdb.ts";
import { fetchPremieres, type Premiere } from "./tvmaze.ts";

/** What arrived from an API for this render. */
export interface Feed<T> {
  items: T[];
  /** false if the API failed and nothing was stored: the fragment shows a notice in its place. */
  ok: boolean;
  /** Seconds since this data was fetched from the API (0 if it was just fetched). */
  age: number;
}

export interface LiveData {
  matches: Feed<Match>;
  premieres: Feed<Premiere>;
}

/** How many matches and news items the fragment shows. */
export const MATCH_COUNT = 3;
export const PREMIERE_COUNT = 3;

/** How long a response is reused before fetching it again. */
export const DATA_TTL_MS = 60_000;

/** A query already wrapped in the cache. */
export type Source<T> = () => Promise<Cached<T[]>>;

export interface Sources {
  matches: Source<Match>;
  premieres: Source<Premiere>;
}

/** Today's UTC date, as both APIs expect it. */
const today = () => new Date().toISOString().slice(0, 10);

/** The real sources, each with its cache. */
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
 * Fetches both sources in parallel. If one fails, the fragment still goes out with the other: an API
 * that's down degrades one section, it doesn't take down the render.
 */
export function createLiveData(
  sources: Sources,
  onError: (error: unknown) => void = (error) => console.warn("news-ssr: an API didn't respond", error),
) {
  return async (now: number): Promise<LiveData> => {
    const [matches, premieres] = await Promise.all([
      toFeed(sources.matches, now, onError),
      toFeed(sources.premieres, now, onError),
    ]);
    return { matches, premieres };
  };
}
