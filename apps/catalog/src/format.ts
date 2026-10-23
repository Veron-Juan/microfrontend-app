/** Readable duration in rounded minutes: 5400 → "90 min". */
export function minutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

/** A title's poster: a gradient from its hue (it's data, not styling). */
export function artGradient(hue: number): string {
  return `linear-gradient(140deg,hsl(${hue} 45% 32%),hsl(${hue + 30} 40% 14%))`;
}
