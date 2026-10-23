// Contracts between micro-frontends.
// It's the only thing the teams share at compile time: types and event names.
// No remote's code lives inside another. Changing something here is changing a public API,
// so it's versioned as one (a new optional field is compatible, renaming one isn't).

export type RenderMode = "CSR" | "SSR" | "SSG";

/** The metadata each Module Federation remote exports alongside its component. */
export interface RemoteMeta {
  name: string;
  version: string;
  team: string;
  render: RenderMode;
}

/** A catalog title. */
export interface Show {
  id: string;
  title: string;
  kind: string;
  /** Duration in seconds. */
  length: number;
  /** The poster's hue, from 0 to 360. Used when there's no image. */
  hue: number;
  /** https URL of the poster. Optional: added in 1.1 without breaking anyone who doesn't use it. */
  image?: string;
  /** The show's TVmaze id, if it comes from there. With it, the details page fetches the rest of the data. */
  tvmazeId?: number;
}

/**
 * Payload of "mfe:select": the catalog emits it when a title is picked and the details page listens.
 * In 1.x it was called "mfe:play". Renaming an event breaks whoever listens to it, which is why this is 2.0.
 */
export interface SelectDetail extends Show {
  /** Name of the remote that emitted the event. */
  from: string;
  /** Date.now() when it was emitted. */
  at: number;
}

/** Every event on the bus and its payload. */
export interface BusEvents {
  "mfe:select": SelectDetail;
}

export type BusEventName = keyof BusEvents;

export const BUS_EVENTS: Record<BusEventName, string> = {
  "mfe:select": "{ id, title, kind, length, hue, image?, tvmazeId?, from, at }",
};

/** Publishes a typed event on the browser's bus (window). */
export function emit<K extends BusEventName>(name: K, detail: BusEvents[K]): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Listens for a typed event. Returns the function to stop listening. */
export function on<K extends BusEventName>(name: K, handler: (detail: BusEvents[K]) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<BusEvents[K]>).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
