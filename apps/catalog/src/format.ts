/** Duración legible en minutos redondeados: 5400 → "90 min". */
export function minutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

/** Carátula de un título: un degradado a partir de su tono (es dato, no estilo). */
export function artGradient(hue: number): string {
  return `linear-gradient(140deg,hsl(${hue} 45% 32%),hsl(${hue + 30} 40% 14%))`;
}
