// The remote's configuration: everything that comes from the environment is read here, in one place.
import pkg from "../package.json" with { type: "json" };

/** Turns an environment variable's value into a valid port, or uses the fallback. */
export function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`invalid PORT: "${value}"`);
  }
  return port;
}

export const config = {
  port: parsePort(process.env.PORT, 5003),
  version: pkg.version,
  /** TheSportsDB key. Without it the public test key is used. */
  sportsDbKey: process.env.SPORTSDB_KEY || undefined,
  /**
   * Usage limit for the whole server (see limits.ts). With at most 8000 renders per day, an
   * uncompressed fragment (~16 KB) adds up to about 4 GB per month: less than Render's free 5 GB.
   */
  limits: { burst: 30, perSecond: 1, perDay: 8000 },
} as const;
