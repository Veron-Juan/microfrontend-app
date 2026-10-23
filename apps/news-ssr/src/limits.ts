// The server's usage limits. On a free plan outbound traffic is scarce (Render Hobby: 5 GB per
// month), so if someone floods it, it's better for News to stop responding than for the traffic to
// turn into a bill. The shell shows its failure notice and the rest of the page stays the same.

export interface LimitOptions {
  /** How many requests can arrive at once. */
  burst: number;
  /** How many are replenished per second. */
  perSecond: number;
  /** Cap on renders per day (UTC), no matter what. */
  perDay: number;
  now?: () => number;
}

const DAY_MS = 86_400_000;
const dayOf = (ms: number) => Math.floor(ms / DAY_MS);

/**
 * One token bucket for the whole server, not per visitor: behind Render's proxy the client IP can
 * be spoofed, so a per-IP limit would be easy to dodge. Returns a function that takes a token and
 * answers how many seconds to wait (0 if the request can go through).
 */
export function createLimiter({ burst, perSecond, perDay, now = Date.now }: LimitOptions): () => number {
  let tokens = burst;
  let last = now();
  let day = dayOf(last);
  let usedToday = 0;

  return () => {
    const t = now();
    if (dayOf(t) !== day) {
      day = dayOf(t);
      usedToday = 0;
    }
    tokens = Math.min(burst, tokens + ((t - last) / 1000) * perSecond);
    last = t;
    if (usedToday >= perDay) return Math.ceil(((day + 1) * DAY_MS - t) / 1000);
    if (tokens < 1) return Math.ceil((1 - tokens) / perSecond);
    tokens -= 1;
    usedToday += 1;
    return 0;
  };
}
