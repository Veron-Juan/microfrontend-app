import { useSyncExternalStore } from "react";
import type { RemoteMeta } from "@mfe/contracts";
import type { AppId } from "../mfe/registry.ts";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

/** What the shell knows about each load of a remote. */
export interface Load {
  status: LoadStatus;
  start?: number;
  end?: number | null;
  ms?: number;
  error?: string | null;
  /** Files requested from the remote's origin during this load. */
  files?: number;
  bytes?: number;
  /** Diagnostic headers of a fragment (SSR/SSG). */
  headers?: Record<string, string>;
  cached?: boolean;
  ttfb?: number | null;
  /** How many times this fragment has been requested. */
  count?: number;
  /** Metadata the remote itself exposed. */
  meta?: RemoteMeta;
  /** Milliseconds between the download and the first painted frame (CSR). */
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

// A minimal store for the shell. Only the shell uses it: the remotes don't share state, they
// communicate through events (see @mfe/contracts). That separation is a key rule of the architecture.
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
