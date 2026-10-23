// In-memory cache for the external APIs. The HTML is rendered on every request, but the data
// doesn't need to be fetched every time: free APIs have call limits and their latency would add up
// on every render.

export interface Cached<T> {
  value: T;
  /** Date.now() of when it was obtained. */
  at: number;
}

/**
 * Wraps a query: it reuses the last result for `ttlMs`, simultaneous requests share a single call
 * and, if the API fails, it returns the last good result even if it has expired (stale-if-error).
 * It only fails if there never was one.
 */
export function cached<T>(load: () => Promise<T>, ttlMs: number, now: () => number = Date.now) {
  let last: Cached<T> | null = null;
  let pending: Promise<Cached<T>> | null = null;

  return async (): Promise<Cached<T>> => {
    if (last && now() - last.at < ttlMs) return last;
    pending ??= load()
      .then((value) => (last = { value, at: now() }))
      .finally(() => (pending = null));
    try {
      return await pending;
    } catch (error) {
      if (last) return last;
      throw error;
    }
  };
}
