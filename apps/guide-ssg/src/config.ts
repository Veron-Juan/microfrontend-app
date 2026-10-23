// The remote's configuration: what comes from the environment and package.json is read here.
import { fileURLToPath } from "node:url";
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

/** A show's TVmaze id: a positive integer, or the fallback if the variable is missing. */
export function parseShowId(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error(`invalid GUIDE_SHOW_ID: "${value}"`);
  return id;
}

export const config = {
  port: parsePort(process.env.PORT, 5004),
  version: pkg.version,
  /** The folder the build generates and the "CDN" serves. */
  outDir: fileURLToPath(new URL("../dist/", import.meta.url)),
  /** The guide's show (its TVmaze id). Breaking Bad by default: it has ended, so its data doesn't change. */
  showId: parseShowId(process.env.GUIDE_SHOW_ID, 169),
} as const;
