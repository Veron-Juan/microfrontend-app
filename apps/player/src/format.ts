/** Reloj m:ss. Trunca a segundos enteros y nunca baja de 0:00. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Avance de la reproducción en porcentaje (0–100). */
export function progress(position: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(100, Math.max(0, (position / length) * 100));
}

/** El reproductor avanza 60× más rápido que el tiempo real para que se note el progreso. */
export const SPEED = 60;

/** Nueva posición tras `elapsedMs` de tiempo real, sin pasarse del final. */
export function advance(position: number, elapsedMs: number, length: number, speed = SPEED): number {
  return Math.min(length, position + (elapsedMs / 1000) * speed);
}

/** Fondo de la pantalla con el tono del título (es dato, no estilo). */
export function screenGradient(hue: number): string {
  return `radial-gradient(120% 90% at 20% 10%,hsl(${hue} 50% 30%),#050505 70%)`;
}
