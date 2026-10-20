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
 player    :5002 ──JS────▶  [ Reproductor ] Module Federation, escucha "mfe:play"         (CSR)    │
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
| player    | 5002   | CSR    | remote de Module Federation                                  | `apps/player`    |
| news-ssr  | 5003   | SSR    | fragmento HTML (Express + `renderToString`)                  | `apps/news-ssr`  |
| guide-ssg | 5004   | SSG    | fragmento HTML estático (`renderToStaticMarkup` en el build) | `apps/guide-ssg` |

Cada remote también se puede abrir solo en su puerto: así lo desarrollaría su equipo sin el shell.

## Qué probar

1. **Inspector** (`I`): bordes por app, con versión, origen y tiempo de carga.
2. **↻ en Novedades**: la hora de render y el id de request cambian cada vez (SSR).
3. **↻ en la Guía**: la hora del build y el ETag no cambian, y responde la caché (SSG).
4. **Elige un título en el catálogo**: el reproductor lo recibe por el evento `mfe:play` sin que ninguno importe al otro.
5. **"tirar" un remote**: su espacio muestra un fallback y el resto sigue vivo. En la Fig 1 su módulo sale del chasis.

## TypeScript

Todo el monorepo es TypeScript estricto (`tsconfig.base.json`, y cada paquete lo extiende).

- Los remotes de Vite (`shell`, `catalog`, `player`) los compila Vite; `tsc` solo revisa tipos (`noEmit`).
- Los servidores (`news-ssr`, `guide-ssg`) y el generador de figuras corren con [`tsx`](https://tsx.is), sin paso de compilación.
- **`packages/contracts`** (`@mfe/contracts`) es lo único que los equipos comparten en tiempo de compilación: los tipos
  de los eventos del bus (`BusEvents`), de la ficha de cada remote (`RemoteMeta`) y helpers tipados `emit()` / `on()`.
  El catálogo no importa al reproductor ni al revés; los dos importan el contrato. Si alguien cambia el payload de
  `mfe:play`, el typecheck de los dos remotes falla antes del deploy.
- Del lado del shell, `loadRemote<RemoteModule>()` tipa lo que expone cada remote, y `__FEDERATION__` está declarado en
  `apps/shell/src/vite-env.d.ts`.

## Estilos: Tailwind en un micro-frontend

Tailwind CSS v4 en todas las apps, con una regla: **se comparten valores, no CSS**.

- **`packages/design-tokens`** (`@mfe/design-tokens`) define la paleta, las tipografías y un color por tipo de render
  como tema de Tailwind (`@theme inline`), con modo claro y oscuro sobre `<html data-theme>`. Es el design system.
- **Cada app compila su propio CSS** a partir de esos tokens. Ninguna depende del CSS de otra, así que un deploy del
  catálogo no puede romper los estilos del shell, ni al revés.
- **Solo el shell** carga el reset de Tailwind (preflight). Los remotes usan un **prefijo** propio (`cat:`, `ply:`,
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
- **Module Federation** (`@module-federation/vite`): el shell registra `catalog` y `player` en runtime con
  `registerRemotes()`, usando el `mf-manifest.json` que publica cada uno, y los carga con `loadRemote()`. React y
  React DOM son `singleton` compartidos, así que se descargan una sola vez.
- **Fragmentos HTML**: el shell hace `fetch` al fragmento y lo inserta. En producción esto suele hacerse en el servidor
  o en el edge (ESI/SSI); aquí se hace en el navegador para que la request se vea.
- **Contrato de eventos**: `packages/contracts/index.ts`. Es la única "API" entre catálogo y reproductor; el shell solo lo escucha (`apps/shell/src/mfe/bus.ts`).
- **Fallos aislados**: los remotes federados van dentro de un error boundary (`mfe/RemoteBoundary.tsx`); los fragmentos,
  en un `try/catch` del fetch (`mfe/fragments.ts`).
  "Tirar" apunta el remote a `localhost:5999`, donde no hay nadie, así que la falla es real.

## Las figuras

`packages/figures` dibuja las dos figuras isométricas con el kit de la skill
[anatomy](https://skills.wheresryan.sh/anatomy) (MIT, copiado en `packages/figures/kit`).
`npm run figures` (`tsx build.ts`) genera `dist/figures.js` y sus tipos (`dist/figures.d.ts`) con los SVG y páginas sueltas para revisarlas (`dist/*-light.html`).
En el shell, `src/figures/` las anima con el estado real de carga:

- **Fig 1 · El rack**: el shell es un chasis y cada remote un módulo que se enchufa cuando termina de cargar.
- **Fig 2 · Tres carriles**: SSG (páginas ya impresas), SSR (una prensa que imprime en cada request) y CSR (piezas que se
  arman en la pantalla). Los tiempos son los medidos en la página.

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
