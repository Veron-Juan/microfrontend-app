import { useSyncExternalStore } from "react";

// Un store mínimo del shell. Solo el shell lo usa: los remotes no comparten estado,
// se comunican por eventos (ver bus.js). Esa separación es una regla clave de la arquitectura.
let state = {
  inspector: false,
  focus: null,
  broken: {},
  nonce: {},
  loads: {},
  events: [],
};
const listeners = new Set();

export const store = {
  get: () => state,
  set(update) {
    state = { ...state, ...(typeof update === "function" ? update(state) : update) };
    listeners.forEach((listener) => listener());
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useStore = (select) => useSyncExternalStore(store.subscribe, () => select(store.get()));

export function markLoad(id, patch) {
  store.set((s) => ({ loads: { ...s.loads, [id]: { ...s.loads[id], ...patch } } }));
}

export const toggleInspector = () => store.set((s) => ({ inspector: !s.inspector }));
export const setFocus = (id) => store.set({ focus: id });
export const reload = (id) => store.set((s) => ({ nonce: { ...s.nonce, [id]: (s.nonce[id] ?? 0) + 1 } }));
export const setBroken = (id, broken) => store.set((s) => ({ broken: { ...s.broken, [id]: broken }, nonce: { ...s.nonce, [id]: (s.nonce[id] ?? 0) + 1 } }));
