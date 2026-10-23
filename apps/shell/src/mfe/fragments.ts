import { OFFLINE_ORIGIN } from "./federation.ts";
import { hostOf, type FragmentApp } from "./registry.ts";

/** Diagnostic headers the shell reads from each fragment to show them in the lesson. */
const DIAGNOSTIC_HEADERS = [
  "x-render-mode",
  "x-app-version",
  "x-rendered-at",
  "x-built-at",
  "x-request-id",
  "server-timing",
  "cache-control",
  "etag",
] as const;

export interface Fragment {
  html: string;
  headers: Record<string, string>;
  /** Whether the browser's HTTP cache answered it without going to the network. */
  cached: boolean;
  /** Time to first byte, in ms. */
  ttfb: number | null;
}

/** Requests an HTML fragment (SSR or SSG). With `offline`, requests it from a dead origin. */
export async function fetchFragment(app: FragmentApp, { offline = false } = {}): Promise<Fragment> {
  const url = offline ? `${OFFLINE_ORIGIN}fragment` : app.entry;
  // SSR: no-store, the server must respond with something new. SSG: let the HTTP cache do its job.
  const response = await fetch(url, { cache: app.render === "SSR" ? "no-store" : "default" });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${hostOf(url)}`);
  const html = await response.text();

  const headers: Record<string, string> = {};
  for (const name of DIAGNOSTIC_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers[name] = value;
  }
  const timing = performance.getEntriesByName(response.url).at(-1) as PerformanceResourceTiming | undefined;
  return {
    html,
    headers,
    cached: timing ? timing.transferSize === 0 && timing.decodedBodySize > 0 : false,
    ttfb: timing?.responseStart ? Math.round(timing.responseStart - timing.requestStart) : null,
  };
}
