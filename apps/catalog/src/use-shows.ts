import { useEffect, useState } from "react";
import type { Show } from "@mfe/contracts";
import { SHOWS } from "./shows.ts";
import { fetchPopularShows, searchShows } from "./tvmaze.ts";

/** How long to wait after the last keystroke before searching, so it doesn't search on every letter. */
export const SEARCH_DELAY_MS = 350;

/** Shorter searches aren't sent: with a single letter TVmaze returns anything. */
export const MIN_QUERY = 2;

export type ShowsStatus = "loading" | "ready" | "fallback" | "error";

interface Result {
  query: string;
  status: "ready" | "fallback" | "error";
  shows: readonly Show[];
}

/**
 * The titles to show: the popular ones if there's no search, or TVmaze's results. While a response
 * is on its way the previous ones stay on screen. If TVmaze doesn't respond on open, the fallback
 * catalog is used so the remote is still useful.
 */
export function useShows(text: string): { shows: readonly Show[]; status: ShowsStatus } {
  const query = text.trim().length >= MIN_QUERY ? text.trim() : "";
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        const request = query ? searchShows(query, controller.signal) : fetchPopularShows(controller.signal);
        request.then(
          (shows) => setResult({ query, status: "ready", shows }),
          (error: unknown) => {
            if (controller.signal.aborted) return;
            console.warn("catalog: TVmaze didn't respond", error);
            setResult(query ? { query, status: "error", shows: [] } : { query, status: "fallback", shows: SHOWS });
          },
        );
      },
      query ? SEARCH_DELAY_MS : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return {
    shows: result?.shows ?? [],
    status: result === null || result.query !== query ? "loading" : result.status,
  };
}
