# Anatomía de un micro-frontend

Una app que enseña la arquitectura micro-frontend **siendo ella misma un micro-frontend**.
Cinco aplicaciones independientes, cada una con su servidor, su versión y su forma de renderizar,
compuestas en vivo por un shell. Con el **inspector** (tecla `I`) ves qué app sirve cada parte.

```
                         ┌──────────────────────── shell :5000 (host, CSR) ────────────────────────┐
                         │  layout · lecciones · inspector · bus de eventos (window)               │
                         │                                                                         │
 news-ssr  :5003 ──HTML──▶  [ Novedades ]   fragmento renderizado en cada request         (SSR)    │
 catalog   :5001 ──JS────▶  [ Catálogo  ]   Module Federation, corre en el navegador      (CSR)    │
 details   :5002 ──JS────▶  [ Ficha     ]   Module Federation, escucha "mfe:select"       (CSR)    │
 guide-ssg :5004 ──HTML──▶  [ Guía      ]   archivo generado en el build, servido como CDN (SSG)   │
                         └─────────────────────────────────────────────────────────────────────────┘
```

## Correrlo

Requiere Node 22 o superior (hay un `.nvmrc`).

```bash
npm install
npm run dev      # construye los remotes y levanta los 5 servidores
# abre http://localhost:5000
```

`npm run build && npm start` hace lo mismo pero sirviendo también el shell ya construido.

Los datos vienen de APIs públicas (ver [Los datos](#los-datos-apis-públicas-reales)). Sin conexión todo sigue andando:
cada remote usa sus datos de respaldo y lo dice en pantalla.

| Comando             | Qué hace                                                        |
| ------------------- | --------------------------------------------------------------- |
| `npm run check`     | Todo lo de abajo junto. Es lo que corre la CI en cada push.     |
| `npm run lint`      | ESLint (typescript-eslint estricto + reglas de hooks de React). |
| `npm run typecheck` | `tsc` en todos los paquetes.                                    |
| `npm test`          | Tests unitarios con el runner nativo de Node (`node:test`).     |
| `npm run format`    | Prettier, que además ordena las clases de Tailwind.             |

| App       | Puerto | Render | Composición                                                  | Código           |
| --------- | ------ | ------ | ------------------------------------------------------------ | ---------------- |
| shell     | 5000   | CSR    | host de Module Federation                                    | `apps/shell`     |
| catalog   | 5001   | CSR    | remote de Module Federation                                  | `apps/catalog`   |
| details   | 5002   | CSR    | remote de Module Federation (la ficha)                       | `apps/details`   |
| news-ssr  | 5003   | SSR    | fragmento HTML (Express + `renderToString`)                  | `apps/news-ssr`  |
| guide-ssg | 5004   | SSG    | fragmento HTML estático (`renderToStaticMarkup` en el build) | `apps/guide-ssg` |

Cada remote también se puede abrir solo en su puerto: así lo desarrollaría su equipo sin el shell.

## Qué probar

1. **Inspector** (`I`): bordes por app, con versión, origen y tiempo de carga.
2. **↻ en Novedades**: la hora de render y el id de request cambian cada vez (SSR), pero los datos dicen "de hace N s":
   vienen de la caché del servidor.
3. **↻ en la Guía**: la hora del build no cambia y el inspector marca "caché": la respuesta salió de la caché HTTP del
   navegador sin ir a la red (SSG). En local, la pestaña Network muestra además que el ETag no cambia.
4. **Busca en el catálogo**: la búsqueda va de tu navegador a TVmaze (CSR). Mírala en la pestaña Network.
5. **Elige un título en el catálogo**: la ficha lo recibe por el evento `mfe:select`, sin que ninguno importe al otro, y
   pide a TVmaze la nota, el resumen y el elenco.
6. **"tirar" un remote**: su espacio muestra un fallback y el resto sigue vivo. En la Fig 1 su pieza se queda arriba y su hueco muestra el aviso.

## TypeScript

Todo el monorepo es TypeScript estricto (`tsconfig.base.json`, y cada paquete lo extiende).

- Los remotes de Vite (`shell`, `catalog`, `details`) los compila Vite; `tsc` solo revisa tipos (`noEmit`).
- Los servidores (`news-ssr`, `guide-ssg`) y el generador de figuras corren con [`tsx`](https://tsx.is), sin paso de compilación.
- **`packages/contracts`** (`@mfe/contracts`) es lo único que los equipos comparten en tiempo de compilación: los tipos
  de los eventos del bus (`BusEvents`), de la ficha de cada remote (`RemoteMeta`) y helpers tipados `emit()` / `on()`.
  El catálogo no importa a la ficha ni al revés; los dos importan el contrato. Si alguien cambia el payload de
  `mfe:select`, el typecheck de los dos remotes falla antes del deploy. Renombrar el evento (antes `mfe:play`) fue un
  cambio incompatible, por eso el contrato pasó a la 2.0.
- Del lado del shell, `loadRemote<RemoteModule>()` tipa lo que expone cada remote, y `__FEDERATION__` está declarado en
  `apps/shell/src/vite-env.d.ts`.

## Estilos: Tailwind en un micro-frontend

Tailwind CSS v4 en todas las apps, con una regla: **se comparten valores, no CSS**.

- **`packages/design-tokens`** (`@mfe/design-tokens`) define la paleta, las tipografías y un color por tipo de render
  como tema de Tailwind (`@theme inline`), con modo claro y oscuro sobre `<html data-theme>`. Es el design system.
- **Cada app compila su propio CSS** a partir de esos tokens. Ninguna depende del CSS de otra, así que un deploy del
  catálogo no puede romper los estilos del shell, ni al revés.
- **Solo el shell** carga el reset de Tailwind (preflight). Los remotes usan un **prefijo** propio (`cat:`, `dtl:`,
  `nws:`, `gde:`) y no traen reset: sus clases nunca chocan con las del shell ni con las de otro remote.
- Los remotes de Vite importan su CSS como texto (`import styles from "./catalog.css?inline"`) y lo renderizan dentro de
  su componente, así viaja con el módulo por Module Federation. Los de SSR y SSG lo compilan con
  `compileTailwind()` (`@mfe/design-tokens/compile`) y lo incrustan en el fragmento HTML.
- El costo: todos deben usar la misma versión mayor de Tailwind, porque comparten sus variables internas (`--tw-*`).

## Cómo está organizado el shell

```
apps/shell/src
├── main.tsx          registra los remotes, escucha el bus y monta la app
├── App.tsx           layout de la página
├── mfe/              todo lo de micro-frontends: registro, Module Federation, fragmentos, fallback
├── inspector/        el borde y la ficha de cada pieza (Slot) y el contador de remotes
├── figures/          las dos figuras animadas, su modelo (con tests) y el bucle de animación
├── lessons/          una sección de la lección por archivo, y el índice que las numera
├── layout/           barra superior, índice lateral, tema y atajo de teclado
├── ui/               componentes chicos reutilizables (Button, Card, Chip, Table…)
├── state/            el store mínimo del shell (con tests)
└── lib/              utilidades puras (con tests)
```

## Cómo está hecho

- **Discovery**: el shell no compila las URLs de sus remotes. Al arrancar lee `remotes.json` (ver más abajo), valida su
  forma (`mfe/discovery.ts`) y arma su registro (`mfe/registry.ts`).
- **Module Federation** (`@module-federation/vite`): el shell registra `catalog` y `details` en runtime con
  `registerRemotes()`, usando el `mf-manifest.json` que publica cada uno, y los carga con `loadRemote()`. React y
  React DOM son `singleton` compartidos, así que se descargan una sola vez.
- **Fragmentos HTML**: el shell hace `fetch` al fragmento y lo inserta. En producción esto suele hacerse en el servidor
  o en el edge (ESI/SSI); aquí se hace en el navegador para que la request se vea.
- **Contrato de eventos**: `packages/contracts/index.ts`. Es la única "API" entre catálogo y ficha; el shell solo lo escucha (`apps/shell/src/mfe/bus.ts`).
- **Fallos aislados**: si falla la descarga de un remote (módulo o fragmento), el shell atrapa el rechazo de la promesa
  y muestra el fallback (`mfe/use-remote-request.ts`). Si un remote federado falla al renderizar, lo atrapa un error
  boundary (`mfe/RemoteBoundary.tsx`).
  "Tirar" apunta el remote a `offline.invalid`, un dominio reservado que nunca resuelve, así que la falla es real.

## Los datos: APIs públicas reales

Cada remote consigue sus datos de la forma que corresponde a cómo renderiza. Ninguna API necesita key ni cuenta.

| Remote      | API                                                                                 | Cuándo se consulta                                        | Si falla                                     |
| ----------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| `guide-ssg` | [TVmaze](https://www.tvmaze.com/api) `/shows/169?embed=episodes`: Breaking Bad      | **Una vez, en el build** (con un reintento)               | Usa la copia del repo (`snapshot.json`)      |
| `news-ssr`  | [TheSportsDB](https://www.thesportsdb.com) (fútbol de hoy) y TVmaze `/schedule/web` | **En el servidor**, con una caché en memoria de 60 s      | Esa sección muestra un aviso; la otra sigue  |
| `catalog`   | TVmaze `/shows` (los más populares) y `/search/shows` (el buscador)                 | **En tu navegador**: es CSR, la request se ve en DevTools | Muestra el catálogo de respaldo (`shows.ts`) |
| `details`   | TVmaze `/shows/:id` con elenco y temporadas, del título que elegiste                | **En tu navegador**, al recibir `mfe:select`; con caché   | Muestra solo los datos que trajo el evento   |

Lo que enseña cada caso:

- **SSG**: los datos se congelan al construir, así que SSG sirve para datos que cambian poco o nada. La guía muestra
  los episodios de una serie terminada: sus datos no cambian, y la guía solo se reconstruye cuando cambia su código.
  El build se niega a publicar una serie que sigue en emisión (`seriesProblems`), porque quedaría vieja sin que nadie
  lo note. Si la API se cae en el build, usa la copia guardada en el repo, que tiene los mismos datos
  (`npm run snapshot -w guide-ssg` la regenera).
- **SSR**: el HTML es nuevo en cada request, pero los datos no hace falta pedirlos cada vez (`news-ssr/src/cache.ts`).
  Las requests simultáneas comparten una llamada, y si la API falla se usa el último dato bueno (_stale-if-error_). Cada
  API tiene su timeout y las dos se piden en paralelo: una caída degrada una sección, no el fragmento entero. La caché se
  precalienta al arrancar.
- **CSR**: el navegador habla directo con la API, así que solo sirve una API pública con CORS y sin secretos. Con una
  key (TMDB, por ejemplo) habría que pasar por un backend propio, porque cualquier key en el navegador es pública.
- **Datos de terceros**: todo se valida al entrar (`parseSeries`, `parseEvents`, `toShow`, `parseDetails`…) y solo se usan nombres e
  imágenes `https`. El resumen de TVmaze llega como HTML y la ficha lo pasa a texto plano (`summaryText`). React escapa los textos antes de que el shell inserte el fragmento
  con `innerHTML`.
- **Atribución**: TVmaze (CC BY-SA) y TheSportsDB aparecen con su enlace en cada remote que las usa.

TheSportsDB usa su key pública de prueba (`123`), que devuelve pocos partidos por día. Con una key propia se pasa
`SPORTSDB_KEY` al servidor. La guía usa `GUIDE_SHOW_ID` (el id de la serie en TVmaze, `169` por defecto); si lo cambias, regenera la copia.

## Las figuras

`packages/figures` dibuja las dos figuras isométricas con el kit de la skill
[anatomy](https://skills.wheresryan.sh/anatomy) (MIT, copiado en `packages/figures/kit`).
`npm run figures` (`tsx build.ts`) genera `dist/figures.js` y sus tipos (`dist/figures.d.ts`) con los SVG y páginas sueltas para revisarlas (`dist/*-light.html`).
En el shell, `src/figures/` las anima con el estado real de carga:

- **Fig 1 · Una página, cinco servidores**: una vista explotada de la demo. El shell pone la página con un hueco por
  remote, y cada remote baja a su hueco cuando termina de cargar, con los tiempos medidos en la página.
- **Fig 2 · Dónde y cuándo se arma el HTML**: una cuadrícula con el build, el servidor y el navegador como columnas y
  SSG, SSR y CSR como filas. Las piezas de cada fila se juntan en una página en una sola celda (el build, el servidor o
  el navegador), y las celdas encendidas forman una diagonal. Los tiempos son los medidos en la página.

## Cómo se maneja SSR, SSG y CSR en un proyecto real

Esta app sigue el reparto que se ve en la mayoría de los proyectos:

| Decisión                         | Quién la toma            | Dónde vive                                                                 |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| Cómo renderiza (SSR, SSG o CSR)  | El equipo de cada remote | En su propio código o framework. Aquí: Express, el script de build o Vite. |
| Dónde vive y qué versión corre   | El pipeline del remote   | El discovery: `apps/shell/public/remotes.json`                             |
| Qué remote va en cada lugar      | El equipo del shell      | El layout del shell: `SLOTS` en `apps/shell/src/mfe/registry.ts`           |
| Cuánto dura en caché cada página | El equipo de cada remote | Cabeceras `Cache-Control` y reglas del CDN                                 |

Con un framework, el render se declara por ruta. En Next.js, `export const dynamic = "force-static"` es SSG y
`export const revalidate = 3600` es ISR. En Nuxt va en `routeRules` (`{ "/guia": { prerender: true } }`). En Astro es
`export const prerender = true`. El shell nunca lo configura: solo lo ve, por la cabecera `X-Render-Mode` o por la
`metadata` del discovery.

## Desplegar

Cada app es un deploy separado, y el shell se construye **una sola vez para todos los entornos**:

1. Cada remote se publica en su origen (`PUBLIC_URL` define desde dónde se sirve en los de Vite).
2. Su pipeline actualiza su entrada en el `remotes.json` de ese entorno: URL del `mf-manifest.json` o del fragmento,
   versión y metadata. En producción ese archivo suele servirlo un servicio de discovery o un CDN; el formato de este
   proyecto está inspirado en el esquema "Frontend Discovery" que publicó AWS.
3. El shell lo lee al arrancar, así que publicar o revertir un remote no requiere volver a desplegar el shell.

`SHELL_BASE` define la ruta base del shell si no se sirve desde `/`.

### Una forma concreta de desplegarlo (con planes gratuitos)

Cuatro apps son archivos estáticos y van a un hosting estático; solo `news-ssr` necesita un servidor. Los estáticos
traen un archivo `_headers` (CORS y caché) que Cloudflare (Pages o Workers) y Netlify entienden igual. Todos los comandos se corren
desde la raíz del repo.

| App         | Dónde                               | Build                                                                     | Publica                | Variables                         |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------- | ---------------------- | --------------------------------- |
| `catalog`   | Cloudflare Pages o Netlify          | `npm run build -w catalog`                                                | `apps/catalog/dist`    | `PUBLIC_URL=https://<su-origen>/` |
| `details`   | Cloudflare Pages o Netlify          | `npm run build -w details`                                                | `apps/details/dist`    | `PUBLIC_URL=https://<su-origen>/` |
| `guide-ssg` | Cloudflare Pages o Netlify          | `npm run build -w guide-ssg`                                              | `apps/guide-ssg/dist`  | opcional: `GUIDE_SHOW_ID`         |
| `news-ssr`  | Render, Fly.io, Railway o Cloud Run | `docker build -f apps/news-ssr/Dockerfile .`                              | el contenedor (`PORT`) | opcional: `SPORTSDB_KEY`          |
| `shell`     | Cloudflare Pages o Netlify          | `npm run figures && npm run build -w shell && npm run discovery -w shell` | `apps/shell/dist`      | `MFE_*_ORIGIN` (abajo)            |

**Cómo está armado en este repo:** los cuatro estáticos van a Cloudflare y `news-ssr` a Render, los dos con plan
gratis.

- **Cloudflare**: cada app estática tiene un `wrangler.jsonc` y se publica como un Worker con archivos estáticos (la
  versión actual de Pages), en `https://mfe-anatomia-<app>.<subdominio>.workers.dev`. El job `deploy` de
  `.github/workflows/ci.yml` corre en cada push a `main`, después de que pasa la CI: construye y publica primero los
  remotes y al final el shell, con su discovery. Necesita dos secretos (`CLOUDFLARE_API_TOKEN`, creado con la plantilla
  _Edit Cloudflare Workers_, y `CLOUDFLARE_ACCOUNT_ID`) y las variables `MFE_{NEWS,CATALOG,DETAILS,GUIDE}_ORIGIN`. Para
  publicar a mano: `npx wrangler deploy --cwd apps/<app>` después del build.
- **Render**: `render.yaml` es un Blueprint (New → Blueprint en Render). Se vuelve a desplegar solo cuando un push a
  `main` toca `news-ssr` o sus dependencias. En el plan gratis se duerme tras 15 minutos sin visitas: la primera visita
  después espera cerca de un minuto, y mientras tanto Novedades muestra su esqueleto.

- **El discovery de producción** lo genera `npm run discovery -w shell` (`apps/shell/scripts/discovery.ts`) a partir de
  `MFE_NEWS_ORIGIN`, `MFE_CATALOG_ORIGIN`, `MFE_DETAILS_ORIGIN` y `MFE_GUIDE_ORIGIN`. Toma las versiones de cada
  `package.json` y lo valida con el mismo parser que usa el shell, así que un discovery roto falla el deploy y no el
  navegador. Aquí lo genera el deploy del shell porque todo vive en un repo; con equipos separados, cada pipeline
  actualizaría solo su entrada.
- **`news-ssr` en Docker**: compila el CSS al arrancar, precalienta la caché, responde `/health` (lo usa el
  `HEALTHCHECK`) y con `SIGTERM` cierra ordenado, que es lo que hace el hosting en cada deploy. Corre el TypeScript con
  `tsx`: el JSX no se puede ejecutar con el _type stripping_ nativo de Node. Su zona horaria (la de la hora de los
  partidos) se fija con `TZ`.
- **Pendiente para un producto real**: componer los fragmentos en el servidor o en el edge (para que el HTML de SSR y
  SSG llegue en el primer documento y lo vean los buscadores) y una Content-Security-Policy con los orígenes del
  discovery.
