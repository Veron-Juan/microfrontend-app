/** @jsxRuntime automatic */
// Builds the fragment and the standalone page. It knows nothing about Express: it receives everything it needs.
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { renderToString } from "react-dom/server";
import type { LiveData } from "./live-data.ts";
import { News } from "./News.tsx";

export interface RenderOptions {
  /** The fragment's compiled CSS; it travels inside the HTML itself. */
  css: string;
  /** This server's request number, to show in the footer. */
  served: number;
  fetchData: (now: number) => Promise<LiveData>;
  now?: () => number;
  newRequestId?: () => string;
}

export interface RenderedFragment {
  html: string;
  now: number;
  requestId: string;
  timing: { data: number; render: number };
}

/** The render time with milliseconds, e.g. "19:28:15.538". */
export function formatRenderedAt(now: number): string {
  const time = new Date(now).toLocaleTimeString("en-GB", { hour12: false });
  return `${time}.${String(now % 1000).padStart(3, "0")}`;
}

/** A match's kickoff time, e.g. "21:30", in the server's time zone (TZ). */
export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const shortId = () => randomUUID().slice(0, 8);

export async function renderFragment({
  css,
  served,
  fetchData,
  now: clock = Date.now,
  newRequestId = shortId,
}: RenderOptions): Promise<RenderedFragment> {
  const t0 = performance.now();
  const now = clock();
  const data = await fetchData(now);
  const t1 = performance.now();
  const requestId = newRequestId();
  const timing = { data: Math.round(t1 - t0), render: 0 };
  const markup = renderToString(
    <News
      rendered={formatRenderedAt(now)}
      requestId={requestId}
      served={served}
      timing={timing}
      formatTime={formatKickoff}
      {...data}
    />,
  );
  timing.render = Math.round((performance.now() - t1) * 10) / 10;
  // The shell inserts the fragment with innerHTML: the <style> goes inside so it arrives complete,
  // without requesting another stylesheet. It's concatenated outside React because React would escape characters like ">".
  return { html: `<style>${css}</style>${markup}`, now, requestId, timing };
}

/** The same app on its own, as a full page (with the fonts the shell loads in production). */
export function standalonePage(fragment: string, css: string): string {
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>news-ssr · standalone</title><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>${css}</style></head><body><p>Remote <b>news-ssr</b> running on its own. Reload and you'll see a different time and id: every request is rendered again.</p>${fragment}</body></html>`;
}
