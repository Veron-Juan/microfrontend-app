import type { ComponentType } from "react";
import { loadRemote, registerRemotes } from "@module-federation/runtime";
import type { RemoteMeta } from "@mfe/contracts";
import { REMOTES, type FederatedApp } from "./registry.ts";

/** Lo que exporta un módulo expuesto por un remote: su componente y su ficha. */
export interface RemoteModule {
  default: ComponentType;
  meta?: RemoteMeta;
}

/** Para simular una caída apuntamos el remote a un puerto donde no hay nadie. */
export const OFFLINE_ORIGIN = "http://localhost:5999/";

/**
 * Registra los remotes con su URL ya resuelta. Así el mismo build funciona en localhost o servido
 * desde otra carpeta, y cambiar de entorno no obliga a recompilar el shell. Se llama una vez, al arrancar.
 */
export function registerFederatedRemotes() {
  const federated = REMOTES.filter((app): app is FederatedApp => app.kind === "federated");
  registerRemotes(
    federated.map((app) => ({ name: app.id, entry: app.entry, type: "module" })),
    { force: true },
  );
}

/** Descarga el módulo expuesto por un remote. Con `offline`, lo pide a un origen caído. */
export async function loadFederatedModule(
  app: FederatedApp,
  { offline = false, attempt = 0 } = {},
): Promise<RemoteModule> {
  let specifier: string = app.module;
  if (offline) {
    // Un nombre nuevo por intento: el runtime cachea los remotes por nombre.
    const name = `${app.id}_offline_${attempt}`;
    const [, expose] = app.module.split("/");
    registerRemotes([{ name, entry: `${OFFLINE_ORIGIN}remoteEntry.js`, type: "module" }]);
    specifier = `${name}/${expose}`;
  }
  const module = await loadRemote<RemoteModule>(specifier);
  if (!module?.default) throw new Error(`${app.name} no expuso un componente por defecto`);
  return module;
}

/** Cuántos archivos pidió el navegador a un origen desde un instante dado. */
export const filesRequestedFrom = (origin: string, since: number) =>
  performance
    .getEntriesByType("resource")
    .filter((entry) => entry.name.startsWith(origin) && entry.startTime >= since - 1).length;
