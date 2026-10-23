import type { Show } from "@mfe/contracts";

/** Filter that shows the whole catalog. */
export const ALL = "All";

/** The fallback catalog: what's shown if TVmaze doesn't respond (see use-shows.ts). */
export const SHOWS: readonly Show[] = [
  { id: "f1", title: "Continental Final", kind: "Sports", length: 5400, hue: 210 },
  { id: "d2", title: "Deep Andes", kind: "Documentary", length: 3000, hue: 150 },
  { id: "s3", title: "The Border", kind: "Series", length: 2700, hue: 20 },
  { id: "n4", title: "Newsroom 24", kind: "News", length: 1800, hue: 280 },
  { id: "k5", title: "Robot Workshop", kind: "Children", length: 1500, hue: 45 },
  { id: "m6", title: "Live Concert", kind: "Music", length: 4200, hue: 330 },
];

/** The available filters: "All" and each kind once, in order of appearance. */
export function kindsOf(shows: readonly Show[]): string[] {
  return [ALL, ...new Set(shows.map((show) => show.kind))];
}

/** The titles of one kind, or all of them if the filter is "All". */
export function filterByKind(shows: readonly Show[], kind: string): readonly Show[] {
  return kind === ALL ? shows : shows.filter((show) => show.kind === kind);
}
