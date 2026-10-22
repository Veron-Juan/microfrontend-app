// Límites de uso del servidor. En un plan gratis la salida de red es poca (Render Hobby: 5 GB por
// mes), así que si alguien lo bombardea es mejor que Novedades deje de responder a que el tráfico se
// convierta en gasto. El shell muestra su aviso de fallo y el resto de la página sigue igual.

export interface LimitOptions {
  /** Cuántas requests pueden llegar de golpe. */
  burst: number;
  /** Cuántas se reponen por segundo. */
  perSecond: number;
  /** Tope de renders por día (UTC), pase lo que pase. */
  perDay: number;
  now?: () => number;
}

const DAY_MS = 86_400_000;
const dayOf = (ms: number) => Math.floor(ms / DAY_MS);

/**
 * Un balde de fichas para todo el servidor, no por visitante: detrás del proxy de Render la IP del
 * cliente se puede falsificar, así que un límite por IP se saltaría fácil. Devuelve una función que
 * consume una ficha y responde cuántos segundos hay que esperar (0 si la request puede pasar).
 */
export function createLimiter({ burst, perSecond, perDay, now = Date.now }: LimitOptions): () => number {
  let tokens = burst;
  let last = now();
  let day = dayOf(last);
  let usedToday = 0;

  return () => {
    const t = now();
    if (dayOf(t) !== day) {
      day = dayOf(t);
      usedToday = 0;
    }
    tokens = Math.min(burst, tokens + ((t - last) / 1000) * perSecond);
    last = t;
    if (usedToday >= perDay) return Math.ceil(((day + 1) * DAY_MS - t) / 1000);
    if (tokens < 1) return Math.ceil((1 - tokens) / perSecond);
    tokens -= 1;
    usedToday += 1;
    return 0;
  };
}
