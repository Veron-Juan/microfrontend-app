/* global __URLS__ */
// Registro de micro-frontends: la "fuente de verdad" del shell sobre quién sirve qué.
// En una empresa grande esto suele venir de un servicio (discovery) y no de un archivo.
// Las URLs pueden ser relativas (vista previa estática): se resuelven contra la página.
export const URLS = Object.fromEntries(Object.entries(__URLS__).map(([key, url]) => [key, new URL(url, document.baseURI).href]));
export const PREVIEW = __PREVIEW__;

export const RENDER = {
  CSR: { label: "CSR", name: "Client-Side Rendering", where: "en el navegador", when: "después de descargar el JavaScript" },
  SSR: { label: "SSR", name: "Server-Side Rendering", where: "en un servidor", when: "en cada request" },
  SSG: { label: "SSG", name: "Static Site Generation", where: "en el build (CI)", when: "una vez por deploy" },
};

export const APPS = [
  {
    id: "shell",
    name: "shell",
    title: "Shell",
    render: "CSR",
    version: "1.0.0",
    team: "Equipo Plataforma",
    composition: "Host",
    url: URLS.shell,
    what: "Layout, navegación, lecciones e inspector. Decide qué remote va en cada lugar.",
  },
  {
    id: "news",
    name: "news-ssr",
    title: "Novedades",
    render: "SSR",
    version: "3.0.2",
    team: "Equipo Contenidos",
    composition: "Fragmento HTML",
    url: URLS.news,
    entry: URLS.news + (PREVIEW ? "fragment/news.html" : "fragment/news"),
    what: "Marcadores y titulares que cambian todo el tiempo: se renderizan en el servidor en cada request.",
  },
  {
    id: "catalog",
    name: "catalog",
    title: "Catálogo",
    render: "CSR",
    version: "1.4.0",
    team: "Equipo Descubrimiento",
    composition: "Module Federation",
    module: "catalog/Catalog",
    url: URLS.catalog,
    entry: URLS.catalog + "remoteEntry.js",
    what: "Interactivo y con filtros: un componente React que se descarga y se ejecuta en el navegador.",
  },
  {
    id: "player",
    name: "player",
    title: "Reproductor",
    render: "CSR",
    version: "2.1.3",
    team: "Equipo Reproducción",
    composition: "Module Federation",
    module: "player/Player",
    url: URLS.player,
    entry: URLS.player + "remoteEntry.js",
    what: "Estado vivo (posición, pausa) y escucha eventos del catálogo: necesita JavaScript en el cliente.",
  },
  {
    id: "guide",
    name: "guide-ssg",
    title: "Guía",
    render: "SSG",
    version: "1.0.7",
    team: "Equipo Programación",
    composition: "Fragmento HTML estático",
    url: URLS.guide,
    entry: URLS.guide + "fragment/guide.html",
    what: "La grilla cambia una vez al día: se genera en el build y se sirve como archivo desde un CDN.",
  },
];

export const REMOTES = APPS.filter((app) => app.id !== "shell");
export const byId = Object.fromEntries(APPS.map((app) => [app.id, app]));
export const hostOf = (url) => new URL(url).host;
