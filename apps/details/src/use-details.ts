import { useEffect, useState } from "react";
import { fetchDetails, type ShowDetails } from "./tvmaze.ts";

export type DetailsStatus = "idle" | "loading" | "ready" | "error";

interface Result {
  id: number;
  details: ShowDetails | null;
  /** How long TVmaze took, or null if it came from the cache. */
  ms: number | null;
}

// Details already fetched: picking a title again doesn't repeat the call. It lives as long as the page.
const cache = new Map<number, ShowDetails>();

/**
 * The chosen title's details. While they arrive, what the catalog sent in the event stays on
 * screen; if TVmaze doesn't respond, the card keeps that data. Picking another title cancels the
 * previous request so a slow response doesn't overwrite the new one.
 */
export function useDetails(id: number | undefined): {
  details: ShowDetails | null;
  status: DetailsStatus;
  ms: number | null;
} {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (id === undefined) return undefined;
    const controller = new AbortController();
    const cached = cache.get(id);
    const start = performance.now();
    const request = cached ? Promise.resolve(cached) : fetchDetails(id, controller.signal);
    request.then(
      (details) => {
        cache.set(id, details);
        setResult({ id, details, ms: cached ? null : Math.round(performance.now() - start) });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn("details: TVmaze didn't respond", error);
        setResult({ id, details: null, ms: null });
      },
    );
    return () => controller.abort();
  }, [id]);

  if (id === undefined) return { details: null, status: "idle", ms: null };
  if (result?.id !== id) return { details: null, status: "loading", ms: null };
  return { details: result.details, status: result.details ? "ready" : "error", ms: result.ms };
}
