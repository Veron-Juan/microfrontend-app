import type { RenderMode } from "@mfe/contracts";
import { fetchDiscovery, type DiscoveredRemote, type Discovery } from "./discovery.ts";

/*
 * El registro del shell: qué piezas tiene la página y quién sirve cada una.
 *
 * Se arma al arrancar a partir de dos fuentes:
 * - El discovery (/remotes.json): dónde vive cada remote y qué versión corre. Lo controla cada equipo.
 * - SLOTS, más abajo: qué remotes espera el layout del shell y cómo los nombra. Lo controla el shell.
 */

export type AppId = "shell" | RemoteId;
export type RemoteId = "news" | "catalog" | "player" | "guide";

interface AppInfo {
  id: AppId;
  /** Nombre del paquete o servicio. */
  name: string;
  title: string;
  render: RenderMode;
  version: string;
  team: string;
  composition: string;
  /** Origen desde el que se sirve. */
  url: string;
}

/** El shell: no se carga, es quien carga a los demás. */
export interface HostApp extends AppInfo {
  kind: "host";
}

/** Un remote de Module Federation: el shell lee su mf-manifest.json y monta un componente. */
export interface FederatedApp extends AppInfo {
  kind: "federated";
  id: RemoteId;
  /** URL de su mf-manifest.json. */
  entry: string;
  /** Nombre del módulo expuesto, sin "./" ("Catalog"). */
  expose: string;
}

/** Un remote que entrega HTML ya renderizado (SSR o SSG): el shell lo pide con fetch y lo inserta. */
export interface FragmentApp extends AppInfo {
  kind: "fragment";
  id: RemoteId;
  /** URL del fragmento HTML. */
  entry: string;
}

export type RemoteApp = FederatedApp | FragmentApp;
export type MicroFrontend = HostApp | RemoteApp;

/** Los lugares del layout. El orden es el de la página. */
const SLOTS: Record<RemoteId, { title: string }> = {
  news: { title: "Novedades" },
  catalog: { title: "Catálogo" },
  player: { title: "Reproductor" },
  guide: { title: "Guía" },
};

const SHELL: Omit<HostApp, "url"> = {
  id: "shell",
  kind: "host",
  name: "shell",
  title: "Shell",
  render: "CSR",
  version: "1.0.0",
  team: "Equipo Plataforma",
  composition: "Host",
};

let registry: { environment: string; apps: readonly MicroFrontend[] } | null = null;

function state() {
  if (!registry) throw new Error("El registro todavía no se cargó: llama a loadRegistry() antes de montar la app");
  return registry;
}

/** Pide el discovery del entorno y arma el registro. Se llama una vez, antes de montar la app. */
export async function loadRegistry(discoveryUrl: string) {
  registry = buildRegistry(await fetchDiscovery(discoveryUrl), new URL(import.meta.env.BASE_URL, location.href).href);
}

/** Cruza el discovery con los lugares del layout. Exportada para poder probarla sin red. */
export function buildRegistry(discovery: Discovery, shellUrl: string) {
  const missing = Object.keys(SLOTS).filter((id) => !discovery.microFrontends[id]);
  if (missing.length) throw new Error(`discovery (${discovery.environment}): faltan ${missing.join(", ")}`);
  const remotes = (Object.keys(SLOTS) as RemoteId[]).map((id) =>
    toApp(id, discovery.microFrontends[id] as DiscoveredRemote),
  );
  return { environment: discovery.environment, apps: [{ ...SHELL, url: shellUrl }, ...remotes] };
}

function toApp(id: RemoteId, remote: DiscoveredRemote): RemoteApp {
  const { name, team, render } = remote.metadata;
  const base = { id, name, team, render, title: SLOTS[id].title, version: remote.version, url: originOf(remote.url) };
  if (remote.type === "module-federation") {
    return {
      ...base,
      kind: "federated",
      composition: "Module Federation",
      entry: remote.url,
      expose: (remote.module ?? "").replace(/^\.\//, ""),
    };
  }
  return {
    ...base,
    kind: "fragment",
    composition: render === "SSG" ? "Fragmento HTML estático" : "Fragmento HTML",
    entry: remote.url,
  };
}

const originOf = (url: string) => new URL("/", url).href;

export const environment = () => state().environment;
export const apps = () => state().apps;
export const remotes = () => apps().filter((app): app is RemoteApp => app.kind !== "host");

export function appById(id: AppId): MicroFrontend {
  const app = apps().find((candidate) => candidate.id === id);
  if (!app) throw new Error(`No hay ninguna app "${id}" en el registro`);
  return app;
}

export function remoteById(id: RemoteId): RemoteApp {
  const app = appById(id);
  if (app.kind === "host") throw new Error(`"${id}" no es un remote`);
  return app;
}

/** "http://localhost:5001/" → "localhost:5001" */
export const hostOf = (url: string) => new URL(url).host;
