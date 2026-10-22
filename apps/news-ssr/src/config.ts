// Configuración del remote: todo lo que viene del entorno se lee aquí, en un solo lugar.
import pkg from "../package.json" with { type: "json" };

/** Convierte el valor de una variable de entorno en un puerto válido, o usa el de respaldo. */
export function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT inválido: "${value}"`);
  }
  return port;
}

export const config = {
  port: parsePort(process.env.PORT, 5003),
  version: pkg.version,
  /** Key de TheSportsDB. Sin ella se usa la key pública de prueba. */
  sportsDbKey: process.env.SPORTSDB_KEY || undefined,
} as const;
