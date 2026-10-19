// Simula la API de marcadores: datos que cambian en cada request. Separado del render para
// poder probarlo sin servidor y sin esperas reales.

export interface Score {
  home: string;
  away: string;
  minute: number;
  goals: [home: number, away: number];
}

export interface LiveData {
  scores: Score[];
  headlines: string[];
}

export const TEAMS: readonly (readonly [home: string, away: string])[] = [
  ["Lima", "Quito"],
  ["Bogotá", "Caracas"],
  ["Santiago", "Montevideo"],
];

export const HEADLINES: readonly string[] = [
  "Se confirma la transmisión en 4K de la final",
  "Nuevo documental sobre la cordillera llega el viernes",
  "El clásico del domingo rompe récord de audiencia",
  "Estrenos de la semana: tres series y una película",
  "Cambios en la grilla por la cobertura especial",
  "La selección anuncia su lista para el amistoso",
];

/** Cuántos titulares muestra el fragmento. */
export const HEADLINE_COUNT = 3;

/** Los datos "en vivo" para un instante dado. Pura: el mismo `now` da el mismo resultado. */
export function liveDataAt(now: number): LiveData {
  const minute = Math.floor(now / 60_000) % 90;
  const scores = TEAMS.map(([home, away], index): Score => ({
    home,
    away,
    minute: ((minute + index * 17) % 90) + 1,
    goals: [Math.floor((now / 47_000 + index) % 4), Math.floor((now / 61_000 + index * 2) % 3)],
  }));
  const start = Math.floor(now / 10_000) % HEADLINES.length;
  const headlines = Array.from(
    { length: HEADLINE_COUNT },
    (_, offset) => HEADLINES[(start + offset) % HEADLINES.length],
  );
  return { scores, headlines };
}

/** Una espera asíncrona; se inyecta para que los tests no dependan de la latencia simulada. */
export type Delay = () => Promise<void>;

/** La latencia de una API real: entre 30 y 80 ms. */
export const simulatedLatency: Delay = () => new Promise((done) => setTimeout(done, 30 + Math.random() * 50));

/** Consulta la "API" de marcadores: espera la latencia y devuelve los datos de ese instante. */
export async function fetchLiveData(now: number, delay: Delay = simulatedLatency): Promise<LiveData> {
  await delay();
  return liveDataAt(now);
}
