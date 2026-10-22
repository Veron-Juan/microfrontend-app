// Configuración del remote: lo que viene del entorno y del package.json se lee aquí.
import { fileURLToPath } from "node:url";
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

/** El id de una serie en TVmaze: un entero positivo, o el de respaldo si la variable no está. */
export function parseShowId(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error(`GUIDE_SHOW_ID inválido: "${value}"`);
  return id;
}

export const config = {
  port: parsePort(process.env.PORT, 5004),
  version: pkg.version,
  /** Carpeta que genera el build y que sirve el "CDN". */
  outDir: fileURLToPath(new URL("../dist/", import.meta.url)),
  /** La serie de la guía (su id en TVmaze). Por defecto, Breaking Bad: terminada, sus datos no cambian. */
  showId: parseShowId(process.env.GUIDE_SHOW_ID, 169),
} as const;
