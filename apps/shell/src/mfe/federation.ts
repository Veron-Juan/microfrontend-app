import type { ComponentType } from "react";
import { loadRemote, registerRemotes } from "@module-federation/runtime";
import type { RemoteMeta } from "@mfe/contracts";
import { remotes, type FederatedApp } from "./registry.ts";

/** What a module exposed by a remote exports: its component and its metadata. */
export interface RemoteModule {
  default: ComponentType;
  meta?: RemoteMeta;
}

/**
 * To simulate an outage we point the remote at an origin that doesn't exist. `.invalid` is a
 * reserved domain (RFC 2606): it never resolves, locally or in production, so the failure is real.
 */
export const OFFLINE_ORIGIN = "https://offline.invalid/";

/**
 * Registers the remotes that discovery returned with the Module Federation runtime. The shell
 * doesn't declare them in its vite.config: that way changing a remote's URL or version doesn't force
 * a shell rebuild. The entry is each remote's mf-manifest.json, which describes what it exposes and
 * shares.
 */
export function registerFederatedRemotes() {
  const federated = remotes().filter((app): app is FederatedApp => app.kind === "federated");
  registerRemotes(
    federated.map((app) => ({ name: app.id, entry: app.entry })),
    { force: true },
  );
}

/** Downloads the module a remote exposes. With `offline`, requests it from a dead origin. */
export async function loadFederatedModule(
  app: FederatedApp,
  { offline = false, attempt = 0 } = {},
): Promise<RemoteModule> {
  let specifier = `${app.id}/${app.expose}`;
  if (offline) {
    // A new name per attempt: the runtime caches remotes by name.
    const name = `${app.id}_offline_${attempt}`;
    registerRemotes([{ name, entry: `${OFFLINE_ORIGIN}mf-manifest.json` }]);
    specifier = `${name}/${app.expose}`;
  }
  const module = await loadRemote<RemoteModule>(specifier);
  if (!module?.default) throw new Error(`${app.name} didn't expose a default component`);
  return module;
}

/** How many files the browser requested from an origin since a given moment. */
export const filesRequestedFrom = (origin: string, since: number) =>
  performance
    .getEntriesByType("resource")
    .filter((entry) => entry.name.startsWith(origin) && entry.startTime >= since - 1).length;
