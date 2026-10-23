import type { RenderMode } from "@mfe/contracts";
import { serverTimingTotal } from "../lib/server-timing.ts";
import type { State } from "../state/store.ts";

/** How long each phase of a lane takes, in milliseconds measured on this page. */
export interface LaneModel {
  server: number;
  transfer: number;
  browser: number;
  ready: boolean;
}

export type RenderModel = Record<RenderMode, LaneModel>;

/**
 * Translates the page's real loads into the three phases of each kind of rendering:
 * SSG does no work on the server, SSR does (Server-Timing says so), and CSR also paints in the browser.
 */
export function renderModel(loads: State["loads"]): RenderModel {
  const { news, guide, catalog } = loads;
  const ssrServer = Math.round(serverTimingTotal(news?.headers?.["server-timing"]));
  return {
    SSG: { server: 0, transfer: guide?.ms ?? 0, browser: 0, ready: guide?.status === "ready" },
    SSR: {
      server: ssrServer,
      transfer: Math.max(1, (news?.ms ?? 0) - ssrServer),
      browser: 0,
      ready: news?.status === "ready",
    },
    CSR: { server: 0, transfer: catalog?.ms ?? 0, browser: catalog?.painted ?? 0, ready: catalog?.status === "ready" },
  };
}

export const laneTotal = (lane: LaneModel) => lane.server + lane.transfer + lane.browser;

/** Cubic ease-in-out curve, from 0 to 1. */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
