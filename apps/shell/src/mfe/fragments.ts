import { OFFLINE_ORIGIN } from "./federation.ts";
import { hostOf, type FragmentApp } from "./registry.ts";

/** Cabeceras de diagnóstico que el shell lee de cada fragmento para mostrarlas en la lección. */
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
  /** Si lo respondió la caché HTTP del navegador sin ir a la red. */
  cached: boolean;
  /** Tiempo hasta el primer byte, en ms. */
  ttfb: number | null;
}

/** Pide un fragmento HTML (SSR o SSG). Con `offline`, lo pide a un origen caído. */
export async function fetchFragment(app: FragmentApp, { offline = false } = {}): Promise<Fragment> {
  const url = offline ? `${OFFLINE_ORIGIN}fragment` : app.entry;
  // SSR: no-store, el servidor debe responder algo nuevo. SSG: dejamos actuar la caché HTTP.
  const response = await fetch(url, { cache: app.render === "SSR" ? "no-store" : "default" });
  if (!response.ok) throw new Error(`HTTP ${response.status} desde ${hostOf(url)}`);
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
