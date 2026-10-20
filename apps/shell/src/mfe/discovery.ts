import type { RenderMode } from "@mfe/contracts";

/*
 * El documento de discovery: dónde vive cada micro-frontend en un entorno.
 *
 * El shell no compila las URLs de los remotes: las lee al arrancar de /remotes.json. En producción
 * ese archivo lo sirve un servicio o un CDN, y el pipeline de cada remote actualiza su entrada al
 * desplegar una versión nueva. Así un remote sale a producción (o vuelve atrás) sin tocar el shell.
 * La forma está inspirada en el Frontend Discovery Service de AWS, una especificación abierta.
 */

export type RemoteType = "module-federation" | "fragment";

export interface DiscoveredRemote {
  type: RemoteType;
  /** mf-manifest.json para Module Federation; la URL del HTML para un fragmento. */
  url: string;
  /** Módulo expuesto ("./Catalog"). Solo para Module Federation. */
  module?: string;
  version: string;
  /** Lo que el pipeline del remote publica sobre sí mismo. El shell solo lo muestra. */
  metadata: { name: string; team: string; render: RenderMode };
}

export interface Discovery {
  environment: string;
  microFrontends: Record<string, DiscoveredRemote>;
}

const RENDER_MODES: readonly string[] = ["CSR", "SSR", "SSG"];
const TYPES: readonly string[] = ["module-federation", "fragment"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Valida el JSON de discovery. Viene de la red y lo escribe otro sistema: mejor fallar al arrancar
 * con un mensaje claro que a mitad de camino con un "undefined is not a function".
 * Las URLs relativas se resuelven contra `base` (la URL del propio archivo).
 */
export function parseDiscovery(json: unknown, base: string): Discovery {
  if (!isRecord(json) || typeof json.environment !== "string" || !isRecord(json.microFrontends)) {
    throw new Error("discovery: se esperaba { environment, microFrontends }");
  }
  const microFrontends: Record<string, DiscoveredRemote> = {};
  for (const [id, entry] of Object.entries(json.microFrontends)) {
    const problem = (detail: string) => new Error(`discovery: "${id}" ${detail}`);
    if (!isRecord(entry)) throw problem("no es un objeto");
    const { type, url, module, version, metadata } = entry;
    if (typeof type !== "string" || !TYPES.includes(type)) throw problem(`tiene un type inválido (${String(type)})`);
    if (typeof url !== "string") throw problem("no tiene url");
    if (typeof version !== "string") throw problem("no tiene version");
    if (type === "module-federation" && (typeof module !== "string" || !module.startsWith("./"))) {
      throw problem('necesita "module", por ejemplo "./Catalog"');
    }
    if (!isRecord(metadata) || typeof metadata.name !== "string" || typeof metadata.team !== "string") {
      throw problem("necesita metadata.name y metadata.team");
    }
    if (typeof metadata.render !== "string" || !RENDER_MODES.includes(metadata.render)) {
      throw problem("necesita metadata.render: CSR, SSR o SSG");
    }
    microFrontends[id] = {
      type: type as RemoteType,
      url: new URL(url, base).href,
      module: typeof module === "string" ? module : undefined,
      version,
      metadata: { name: metadata.name, team: metadata.team, render: metadata.render as RenderMode },
    };
  }
  return { environment: json.environment, microFrontends };
}

/** Descarga y valida el discovery del entorno actual. */
export async function fetchDiscovery(url: string): Promise<Discovery> {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`discovery: HTTP ${response.status} al pedir ${url}`);
  return parseDiscovery(await response.json(), response.url || url);
}
