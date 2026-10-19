// Contratos entre micro-frontends.
// Es lo único que los equipos comparten en tiempo de compilación: tipos y nombres de eventos.
// No hay código de un remote dentro de otro. Cambiar algo aquí es cambiar una API pública,
// así que se versiona como tal (un campo nuevo opcional es compatible, renombrar uno no).

export type RenderMode = "CSR" | "SSR" | "SSG";

/** La ficha que cada remote de Module Federation exporta junto a su componente. */
export interface RemoteMeta {
  name: string;
  version: string;
  team: string;
  render: RenderMode;
}

/** Un título del catálogo. */
export interface Show {
  id: string;
  title: string;
  kind: string;
  /** Duración en segundos. */
  length: number;
  /** Tono de color de la carátula, de 0 a 360. */
  hue: number;
}

/** Payload de "mfe:play": el catálogo lo emite, el reproductor lo escucha. */
export interface PlayDetail extends Show {
  /** Nombre del remote que emitió el evento. */
  from: string;
  /** Date.now() al emitirlo, para medir la latencia del bus. */
  at: number;
}

/** Todos los eventos del bus y su payload. */
export interface BusEvents {
  "mfe:play": PlayDetail;
}

export type BusEventName = keyof BusEvents;

export const BUS_EVENTS: Record<BusEventName, string> = {
  "mfe:play": "{ id, title, kind, length, hue, from, at }",
};

/** Publica un evento tipado en el bus del navegador (window). */
export function emit<K extends BusEventName>(name: K, detail: BusEvents[K]): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Escucha un evento tipado. Devuelve la función para dejar de escuchar. */
export function on<K extends BusEventName>(name: K, handler: (detail: BusEvents[K]) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<BusEvents[K]>).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
