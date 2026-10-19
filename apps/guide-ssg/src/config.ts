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

export const config = {
  port: parsePort(process.env.PORT, 5004),
  version: pkg.version,
  /** Carpeta que genera el build y que sirve el "CDN". */
  outDir: fileURLToPath(new URL("../dist/", import.meta.url)),
} as const;
