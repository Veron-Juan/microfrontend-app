/** Suma las duraciones de una cabecera Server-Timing ("data;dur=42, render;dur=1.5" → 43.5). */
export function serverTimingTotal(header: string | undefined): number {
  if (!header) return 0;
  return header.split(",").reduce((sum, metric) => sum + Number(/dur=([\d.]+)/.exec(metric)?.[1] ?? 0), 0);
}
