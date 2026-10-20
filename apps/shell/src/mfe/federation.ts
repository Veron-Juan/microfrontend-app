import type { ComponentType } from "react";
import { loadRemote, registerRemotes } from "@module-federation/runtime";
import type { RemoteMeta } from "@mfe/contracts";
import { remotes, type FederatedApp } from "./registry.ts";

/** Lo que exporta un módulo expuesto por un remote: su componente y su ficha. */
export interface RemoteModule {
  default: ComponentType;
  meta?: RemoteMeta;
}

/** Para simular una caída apuntamos el remote a un puerto donde no hay nadie. */
export const OFFLINE_ORIGIN = "http://localhost:5999/";

/**
 * Registra en el runtime de Module Federation los remotes que trajo el discovery. El shell no los
 * declara en su vite.config: así cambiar la URL o la versión de un remote no obliga a recompilarlo.
 * La entrada es el mf-manifest.json de cada remote, que describe qué expone y qué comparte.
 */
export function registerFederatedRemotes() {
  const federated = remotes().filter((app): app is FederatedApp => app.kind === "federated");
  registerRemotes(
    federated.map((app) => ({ name: app.id, entry: app.entry })),
    { force: true },
  );
}

/** Descarga el módulo expuesto por un remote. Con `offline`, lo pide a un origen caído. */
export async function loadFederatedModule(
  app: FederatedApp,
  { offline = false, attempt = 0 } = {},
): Promise<RemoteModule> {
  let specifier = `${app.id}/${app.expose}`;
  if (offline) {
    // Un nombre nuevo por intento: el runtime cachea los remotes por nombre.
    const name = `${app.id}_offline_${attempt}`;
    registerRemotes([{ name, entry: `${OFFLINE_ORIGIN}mf-manifest.json` }]);
    specifier = `${name}/${app.expose}`;
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
