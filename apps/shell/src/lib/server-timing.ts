/** Sums the durations in a Server-Timing header ("data;dur=42, render;dur=1.5" → 43.5). */
export function serverTimingTotal(header: string | undefined): number {
  if (!header) return 0;
  return header.split(",").reduce((sum, metric) => sum + Number(/dur=([\d.]+)/.exec(metric)?.[1] ?? 0), 0);
}
