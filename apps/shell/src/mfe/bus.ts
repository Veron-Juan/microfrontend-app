import { BUS_EVENTS, on, type BusEventName } from "@mfe/contracts";
import { store } from "../state/store.ts";

// El contrato de eventos entre micro-frontends vive en @mfe/contracts. Es lo único que
// catálogo y reproductor "comparten": un nombre de evento y la forma de su payload.
export const CONTRACT = BUS_EVENTS;

const MAX_EVENTS = 6;
let sequence = 0;

/** El shell escucha el bus solo para mostrarlo en pantalla; no participa de la conversación. */
export function watchBus() {
  const names = Object.keys(BUS_EVENTS) as BusEventName[];
  const stops = names.map((name) =>
    on(name, (detail) =>
      store.set((s) => ({
        events: [{ name, at: Date.now(), detail, key: ++sequence }, ...s.events].slice(0, MAX_EVENTS),
      })),
    ),
  );
  return () => stops.forEach((stop) => stop());
}
