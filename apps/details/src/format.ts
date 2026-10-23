/** Poster background in the title's hue, for when there's no image (it's data, not styling). */
export function posterGradient(hue: number): string {
  return `linear-gradient(140deg,hsl(${hue} 45% 32%),hsl(${hue + 30} 40% 14%))`;
}

/**
 * Poster background: the image or the hue's gradient. The URL arrives over the bus, so only https
 * is accepted and it goes inside escaped quotes so it can't inject CSS.
 */
export function posterBackground(show: { hue: number; image?: string }): string {
  if (!show.image?.startsWith("https://")) return posterGradient(show.hue);
  return `url(${JSON.stringify(show.image)}) center/cover,${posterGradient(show.hue)}`;
}

const STATUS: Readonly<Record<string, string>> = {
  Ended: "ended",
  Running: "airing",
  "To Be Determined": "TBD",
  "In Development": "in development",
};

/** TVmaze's status as a short label, or as is if it's a new one. */
export const statusLabel = (status: string) => STATUS[status] ?? status;

/** "2008–2019" if it ended, "2015–" if it continues, or "" if its start is unknown. */
export function years(premiered: string | null, ended: string | null): string {
  if (!premiered) return "";
  return `${premiered.slice(0, 4)}–${ended ? ended.slice(0, 4) : ""}`;
}

/** Readable duration in rounded minutes: 3600 → "60 min". */
export function minutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

/** "9.2": the rating with one decimal. */
export const formatRating = (rating: number) =>
  rating.toLocaleString("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
