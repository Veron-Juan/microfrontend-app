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
  /** Tono de color de la carátula, de 0 a 360. Se usa cuando no hay imagen. */
  hue: number;
  /** URL https de la carátula. Opcional: se agregó en la 1.1 sin romper a quien no la usa. */
  image?: string;
  /** Id del programa en TVmaze, si viene de ahí. Con él, la ficha pide el resto de los datos. */
  tvmazeId?: number;
}

/**
 * Payload de "mfe:select": el catálogo lo emite al elegir un título y la ficha lo escucha.
 * En la 1.x se llamaba "mfe:play". Renombrar un evento rompe a quien lo escucha, por eso es la 2.0.
 */
export interface SelectDetail extends Show {
  /** Nombre del remote que emitió el evento. */
  from: string;
  /** Date.now() al emitirlo. */
  at: number;
}

/** Todos los eventos del bus y su payload. */
export interface BusEvents {
  "mfe:select": SelectDetail;
}

export type BusEventName = keyof BusEvents;

export const BUS_EVENTS: Record<BusEventName, string> = {
  "mfe:select": "{ id, title, kind, length, hue, image?, tvmazeId?, from, at }",
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
