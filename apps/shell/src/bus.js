import { store } from "./store.js";

// El contrato de eventos entre micro-frontends. Es lo único que catálogo y reproductor
// "comparten": un nombre de evento y la forma de su payload. Cambiarlo es un cambio de API.
export const CONTRACT = {
  "mfe:play": "{ id, title, kind, length, hue, from, at }",
};

// El shell escucha el bus solo para mostrarlo en pantalla; no participa de la conversación.
export function watchBus() {
  const handlers = Object.keys(CONTRACT).map((name) => {
    const handler = (event) =>
      store.set((s) => ({
        events: [{ name, at: Date.now(), detail: event.detail, key: Math.random() }, ...s.events].slice(0, 6),
      }));
    window.addEventListener(name, handler);
    return [name, handler];
  });
  return () => handlers.forEach(([name, handler]) => window.removeEventListener(name, handler));
}
