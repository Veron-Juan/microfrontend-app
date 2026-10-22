import { useEffect, useState } from "react";
import { fetchDetails, type ShowDetails } from "./tvmaze.ts";

export type DetailsStatus = "idle" | "loading" | "ready" | "error";

interface Result {
  id: number;
  details: ShowDetails | null;
  /** Lo que tardó TVmaze, o null si salió de la caché. */
  ms: number | null;
}

// Las fichas ya pedidas: volver a elegir un título no repite la llamada. Vive lo que vive la página.
const cache = new Map<number, ShowDetails>();

/**
 * La ficha del título elegido. Mientras llega se sigue mostrando lo que mandó el catálogo en el
 * evento; si TVmaze no responde, la ficha queda con esos datos. Elegir otro título cancela el pedido
 * anterior para que una respuesta lenta no pise a la nueva.
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
        console.warn("details: TVmaze no respondió", error);
        setResult({ id, details: null, ms: null });
      },
    );
    return () => controller.abort();
  }, [id]);

  if (id === undefined) return { details: null, status: "idle", ms: null };
  if (result?.id !== id) return { details: null, status: "loading", ms: null };
  return { details: result.details, status: result.details ? "ready" : "error", ms: result.ms };
}
