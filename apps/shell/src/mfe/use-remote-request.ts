import { useEffect, useState } from "react";
import { markLoad, useStore, type Load } from "../state/store.ts";
import { errorMessage } from "../lib/errors.ts";
import type { RemoteApp } from "./registry.ts";

export interface RequestOptions {
  /** Pedirlo a un origen caído, para simular la falla. */
  offline: boolean;
  /** Número de intento; cambia con cada recarga desde el inspector. */
  attempt: number;
}

/** Cómo se pide un tipo de remote y qué se mide de la respuesta. Se define una vez por tipo, fuera de React. */
export interface RemoteLoader<A extends RemoteApp, T> {
  request: (app: A, options: RequestOptions) => Promise<T>;
  measure: (app: A, value: T, timing: { start: number; end: number }) => Partial<Load>;
}

export type RemoteResult<T> =
  { status: "loading" } | { status: "ready"; value: T } | { status: "error"; error: unknown };

/**
 * Pide un remote y lo vuelve a pedir cuando el inspector lo recarga o lo "tira".
 * Cada resultado se guarda con el intento que lo produjo: uno viejo se ignora (y no se mide),
 * y mientras el intento actual no responde se ve "loading" sin resetear estado dentro del efecto.
 */
export function useRemoteRequest<A extends RemoteApp, T>(app: A, loader: RemoteLoader<A, T>) {
  const offline = useStore((s) => !!s.broken[app.id]);
  const attempt = useStore((s) => s.nonce[app.id] ?? 0);
  const key = `${app.id}:${attempt}:${offline}`;
  const [settled, setSettled] = useState<{ key: string; result: RemoteResult<T> } | null>(null);

  useEffect(() => {
    let current = true;
    const start = performance.now();
    markLoad(app.id, { status: "loading", start, end: null, error: null });
    loader.request(app, { offline, attempt }).then(
      (value) => {
        if (!current) return;
        const end = performance.now();
        markLoad(app.id, {
          status: "ready",
          end,
          ms: Math.round(end - start),
          ...loader.measure(app, value, { start, end }),
        });
        setSettled({ key, result: { status: "ready", value } });
      },
      (error: unknown) => {
        if (!current) return;
        markLoad(app.id, { status: "error", end: performance.now(), error: errorMessage(error) });
        setSettled({ key, result: { status: "error", error } });
      },
    );
    return () => {
      current = false;
    };
  }, [app, loader, key, offline, attempt]);

  const result: RemoteResult<T> = settled?.key === key ? settled.result : { status: "loading" };
  return { result, attempt };
}
