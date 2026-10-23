import type { RenderMode } from "@mfe/contracts";
import { fetchDiscovery, type DiscoveredRemote, type Discovery } from "./discovery.ts";

/*
 * The shell's registry: which pieces the page has and who serves each one.
 *
 * It's built at startup from two sources:
 * - Discovery (/remotes.json): where each remote lives and which version it runs. Each team controls it.
 * - SLOTS, below: which remotes the shell's layout expects and what it calls them. The shell controls it.
 */

export type AppId = "shell" | RemoteId;
export type RemoteId = "news" | "catalog" | "details" | "guide";

interface AppInfo {
  id: AppId;
  /** Package or service name. */
  name: string;
  title: string;
  render: RenderMode;
  version: string;
  team: string;
  composition: string;
  /** Origin it's served from. */
  url: string;
}

/** The shell: it isn't loaded, it's the one that loads the others. */
export interface HostApp extends AppInfo {
  kind: "host";
}

/** A Module Federation remote: the shell reads its mf-manifest.json and mounts a component. */
export interface FederatedApp extends AppInfo {
  kind: "federated";
  id: RemoteId;
  /** URL of its mf-manifest.json. */
  entry: string;
  /** Name of the exposed module, without "./" ("Catalog"). */
  expose: string;
}

/** A remote that delivers already-rendered HTML (SSR or SSG): the shell fetches it and inserts it. */
export interface FragmentApp extends AppInfo {
  kind: "fragment";
  id: RemoteId;
  /** URL of the HTML fragment. */
  entry: string;
}

export type RemoteApp = FederatedApp | FragmentApp;
export type MicroFrontend = HostApp | RemoteApp;

/** The layout's slots. The order is the page's. */
const SLOTS: Record<RemoteId, { title: string }> = {
  news: { title: "News" },
  catalog: { title: "Catalog" },
  details: { title: "Details" },
  guide: { title: "Guide" },
};

const SHELL: Omit<HostApp, "url"> = {
  id: "shell",
  kind: "host",
  name: "shell",
  title: "Shell",
  render: "CSR",
  version: "1.0.0",
  team: "Platform team",
  composition: "Host",
};

let registry: { environment: string; apps: readonly MicroFrontend[] } | null = null;

function state() {
  if (!registry) throw new Error("The registry hasn't loaded yet: call loadRegistry() before mounting the app");
  return registry;
}

/** Fetches the environment's discovery and builds the registry. Called once, before mounting the app. */
export async function loadRegistry(discoveryUrl: string) {
  registry = buildRegistry(await fetchDiscovery(discoveryUrl), new URL(import.meta.env.BASE_URL, location.href).href);
}

/** Matches the discovery against the layout's slots. Exported so it can be tested without a network. */
export function buildRegistry(discovery: Discovery, shellUrl: string) {
  const missing = Object.keys(SLOTS).filter((id) => !discovery.microFrontends[id]);
  if (missing.length) throw new Error(`discovery (${discovery.environment}): missing ${missing.join(", ")}`);
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
    composition: render === "SSG" ? "Static HTML fragment" : "HTML fragment",
    entry: remote.url,
  };
}

const originOf = (url: string) => new URL("/", url).href;

export const environment = () => state().environment;
export const apps = () => state().apps;
export const remotes = () => apps().filter((app): app is RemoteApp => app.kind !== "host");

export function appById(id: AppId): MicroFrontend {
  const app = apps().find((candidate) => candidate.id === id);
  if (!app) throw new Error(`There is no app "${id}" in the registry`);
  return app;
}

export function remoteById(id: RemoteId): RemoteApp {
  const app = appById(id);
  if (app.kind === "host") throw new Error(`"${id}" is not a remote`);
  return app;
}

/** "http://localhost:5001/" → "localhost:5001" */
export const hostOf = (url: string) => new URL(url).host;
