import { useSyncExternalStore } from "react";
import type { RemoteMeta } from "@mfe/contracts";
import type { AppId } from "../mfe/registry.ts";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

/** Lo que el shell sabe de cada carga de un remote. */
export interface Load {
  status: LoadStatus;
  start?: number;
  end?: number | null;
  ms?: number;
  error?: string | null;
  /** Archivos pedidos al origen del remote durante esta carga. */
  files?: number;
  bytes?: number;
  /** Cabeceras de diagnóstico de un fragmento (SSR/SSG). */
  headers?: Record<string, string>;
  cached?: boolean;
  ttfb?: number | null;
  /** Cuántas veces se pidió este fragmento. */
  count?: number;
  /** Ficha que expuso el propio remote. */
  meta?: RemoteMeta;
  /** Milisegundos entre la descarga y el primer frame pintado (CSR). */
  paint?: number;
  painted?: number;
}

export interface State {
  inspector: boolean;
  focus: AppId | null;
  broken: Partial<Record<AppId, boolean>>;
  nonce: Partial<Record<AppId, number>>;
  loads: Partial<Record<AppId, Load>>;
}

// Un store mínimo del shell. Solo el shell lo usa: los remotes no comparten estado,
// se comunican por eventos (ver @mfe/contracts). Esa separación es una regla clave de la arquitectura.
export const initialState: State = {
  inspector: false,
  focus: null,
  broken: {},
  nonce: {},
  loads: {},
};
let state = initialState;
const listeners = new Set<() => void>();

export const store = {
  get: (): State => state,
  set(update: Partial<State> | ((s: State) => Partial<State>)) {
    state = { ...state, ...(typeof update === "function" ? update(state) : update) };
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useStore = <T>(select: (s: State) => T): T =>
  useSyncExternalStore(store.subscribe, () => select(store.get()));

export function markLoad(id: AppId, patch: Partial<Load>) {
  store.set((s) => ({ loads: { ...s.loads, [id]: { status: "idle", ...s.loads[id], ...patch } } }));
}

export const toggleInspector = () => store.set((s) => ({ inspector: !s.inspector }));
export const setFocus = (id: AppId | null) => store.set({ focus: id });
export const reload = (id: AppId) => store.set((s) => ({ nonce: { ...s.nonce, [id]: (s.nonce[id] ?? 0) + 1 } }));
export const setBroken = (id: AppId, broken: boolean) =>
  store.set((s) => ({ broken: { ...s.broken, [id]: broken }, nonce: { ...s.nonce, [id]: (s.nonce[id] ?? 0) + 1 } }));
