// Caché en memoria para las APIs externas. El HTML se renderiza en cada request, pero los datos
// no hace falta pedirlos cada vez: las APIs gratuitas tienen límite de llamadas y su latencia se
// sumaría a cada render.

export interface Cached<T> {
  value: T;
  /** Date.now() de cuando se obtuvo. */
  at: number;
}

/**
 * Envuelve una consulta: reutiliza el último resultado durante `ttlMs`, las requests simultáneas
 * comparten una sola llamada y, si la API falla, devuelve el último resultado bueno aunque haya
 * vencido (stale-if-error). Solo falla si nunca hubo uno.
 */
export function cached<T>(load: () => Promise<T>, ttlMs: number, now: () => number = Date.now) {
  let last: Cached<T> | null = null;
  let pending: Promise<Cached<T>> | null = null;

  return async (): Promise<Cached<T>> => {
    if (last && now() - last.at < ttlMs) return last;
    pending ??= load()
      .then((value) => (last = { value, at: now() }))
      .finally(() => (pending = null));
    try {
      return await pending;
    } catch (error) {
      if (last) return last;
      throw error;
    }
  };
}
