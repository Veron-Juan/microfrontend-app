import type { Show } from "@mfe/contracts";

/** Filtro que muestra todo el catálogo. */
export const ALL = "Todo";

/** El catálogo de respaldo: lo que se muestra si TVmaze no responde (ver use-shows.ts). */
export const SHOWS: readonly Show[] = [
  { id: "f1", title: "Final continental", kind: "Deportes", length: 5400, hue: 210 },
  { id: "d2", title: "Andes profundos", kind: "Documental", length: 3000, hue: 150 },
  { id: "s3", title: "La frontera", kind: "Serie", length: 2700, hue: 20 },
  { id: "n4", title: "Noticiero 24", kind: "Noticias", length: 1800, hue: 280 },
  { id: "k5", title: "Taller de robots", kind: "Infantil", length: 1500, hue: 45 },
  { id: "m6", title: "Concierto en vivo", kind: "Música", length: 4200, hue: 330 },
];

/** Los filtros disponibles: "Todo" y cada tipo una sola vez, en orden de aparición. */
export function kindsOf(shows: readonly Show[]): string[] {
  return [ALL, ...new Set(shows.map((show) => show.kind))];
}

/** Los títulos de un tipo, o todos si el filtro es "Todo". */
export function filterByKind(shows: readonly Show[], kind: string): readonly Show[] {
  return kind === ALL ? shows : shows.filter((show) => show.kind === kind);
}
