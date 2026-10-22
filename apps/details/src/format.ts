/** Fondo de la carátula con el tono del título, para cuando no hay imagen (es dato, no estilo). */
export function posterGradient(hue: number): string {
  return `linear-gradient(140deg,hsl(${hue} 45% 32%),hsl(${hue + 30} 40% 14%))`;
}

/**
 * Fondo de la carátula: la imagen o el degradado del tono. La URL llega por el bus, así que solo
 * se aceptan https y va entre comillas escapadas para que no pueda inyectar CSS.
 */
export function posterBackground(show: { hue: number; image?: string }): string {
  if (!show.image?.startsWith("https://")) return posterGradient(show.hue);
  return `url(${JSON.stringify(show.image)}) center/cover,${posterGradient(show.hue)}`;
}

const STATUS: Readonly<Record<string, string>> = {
  Ended: "terminada",
  Running: "en emisión",
  "To Be Determined": "sin confirmar",
  "In Development": "en desarrollo",
};

/** El estado de TVmaze en español, o tal cual si es uno nuevo. */
export const statusLabel = (status: string) => STATUS[status] ?? status;

/** "2008–2019" si terminó, "2015–" si sigue, o "" si no se sabe cuándo empezó. */
export function years(premiered: string | null, ended: string | null): string {
  if (!premiered) return "";
  return `${premiered.slice(0, 4)}–${ended ? ended.slice(0, 4) : ""}`;
}

/** Duración legible en minutos redondeados: 3600 → "60 min". */
export function minutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

/** "9,2": la nota con un decimal, como se escribe en español. */
export const formatRating = (rating: number) =>
  rating.toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
