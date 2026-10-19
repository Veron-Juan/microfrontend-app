import type { RenderMode } from "@mfe/contracts";

// Registro de micro-frontends: la "fuente de verdad" del shell sobre quién sirve qué.
// En una empresa grande esto suele venir de un servicio (discovery) y no de un archivo.
// Las URLs pueden ser relativas (vista previa estática): se resuelven contra la página.
export const URLS = Object.fromEntries(
  Object.entries(__URLS__).map(([key, url]) => [key, new URL(url, document.baseURI).href]),
) as Record<keyof typeof __URLS__, string>;
export const PREVIEW = __PREVIEW__;

export type AppId = "shell" | "news" | "catalog" | "player" | "guide";

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

/** Un remote de Module Federation: el shell descarga su remoteEntry.js y monta un componente. */
export interface FederatedApp extends AppInfo {
  kind: "federated";
  /** URL de su remoteEntry.js. */
  entry: string;
  /** "remote/Expuesto", como se le pide a loadRemote(). */
  module: `${string}/${string}`;
}

/** Un remote que entrega HTML ya renderizado (SSR o SSG): el shell lo pide con fetch y lo inserta. */
export interface FragmentApp extends AppInfo {
  kind: "fragment";
  /** URL del fragmento HTML. */
  entry: string;
}

export type RemoteApp = FederatedApp | FragmentApp;
export type MicroFrontend = HostApp | RemoteApp;

export const APPS: readonly MicroFrontend[] = [
  {
    id: "shell",
    kind: "host",
    name: "shell",
    title: "Shell",
    render: "CSR",
    version: "1.0.0",
    team: "Equipo Plataforma",
    composition: "Host",
    url: URLS.shell,
  },
  {
    id: "news",
    kind: "fragment",
    name: "news-ssr",
    title: "Novedades",
    render: "SSR",
    version: "3.0.2",
    team: "Equipo Contenidos",
    composition: "Fragmento HTML",
    url: URLS.news,
    entry: URLS.news + (PREVIEW ? "fragment/news.html" : "fragment/news"),
  },
  {
    id: "catalog",
    kind: "federated",
    name: "catalog",
    title: "Catálogo",
    render: "CSR",
    version: "1.4.0",
    team: "Equipo Descubrimiento",
    composition: "Module Federation",
    module: "catalog/Catalog",
    url: URLS.catalog,
    entry: URLS.catalog + "remoteEntry.js",
  },
  {
    id: "player",
    kind: "federated",
    name: "player",
    title: "Reproductor",
    render: "CSR",
    version: "2.1.3",
    team: "Equipo Reproducción",
    composition: "Module Federation",
    module: "player/Player",
    url: URLS.player,
    entry: URLS.player + "remoteEntry.js",
  },
  {
    id: "guide",
    kind: "fragment",
    name: "guide-ssg",
    title: "Guía",
    render: "SSG",
    version: "1.0.7",
    team: "Equipo Programación",
    composition: "Fragmento HTML estático",
    url: URLS.guide,
    entry: URLS.guide + "fragment/guide.html",
  },
];

export const REMOTES = APPS.filter((app): app is RemoteApp => app.kind !== "host");
export const byId = Object.fromEntries(APPS.map((app) => [app.id, app])) as Record<AppId, MicroFrontend>;

/** "http://localhost:5001/" → "localhost:5001" */
export const hostOf = (url: string) => new URL(url).host;
