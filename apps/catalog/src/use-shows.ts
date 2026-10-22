import { useEffect, useState } from "react";
import type { Show } from "@mfe/contracts";
import { SHOWS } from "./shows.ts";
import { fetchPopularShows, searchShows } from "./tvmaze.ts";

/** Cuánto espera tras la última tecla antes de buscar, para no pedir una búsqueda por letra. */
export const SEARCH_DELAY_MS = 350;

/** Búsquedas más cortas no se envían: con una letra TVmaze devuelve cualquier cosa. */
export const MIN_QUERY = 2;

export type ShowsStatus = "loading" | "ready" | "fallback" | "error";

interface Result {
  query: string;
  status: "ready" | "fallback" | "error";
  shows: readonly Show[];
}

/**
 * Los títulos a mostrar: los populares si no hay búsqueda, o los resultados de TVmaze. Mientras
 * llega una respuesta se siguen mostrando los anteriores. Si TVmaze no responde al abrir, se usa
 * el catálogo de respaldo para que el remote siga siendo útil.
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
            console.warn("catalog: TVmaze no respondió", error);
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
