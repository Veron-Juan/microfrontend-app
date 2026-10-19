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

Requiere Node 20 o superior.

```bash
npm install
npm run dev      # construye los remotes y levanta los 5 servidores
# abre http://localhost:5000
```

`npm run build && npm start` hace lo mismo pero sirviendo también el shell ya construido.

| App | Puerto | Render | Composición | Código |
|---|---|---|---|---|
| shell | 5000 | CSR | host de Module Federation | `apps/shell` |
| catalog | 5001 | CSR | remote de Module Federation | `apps/catalog` |
| player | 5002 | CSR | remote de Module Federation | `apps/player` |
| news-ssr | 5003 | SSR | fragmento HTML (Express + `renderToString`) | `apps/news-ssr` |
| guide-ssg | 5004 | SSG | fragmento HTML estático (`renderToStaticMarkup` en el build) | `apps/guide-ssg` |

Cada remote también se puede abrir solo en su puerto: así lo desarrollaría su equipo sin el shell.

## Qué probar

1. **Inspector** (`I`): bordes por app, con versión, origen y tiempo de carga.
2. **↻ en Novedades**: la hora de render y el id de request cambian cada vez (SSR).
3. **↻ en la Guía**: la hora del build y el ETag no cambian, y responde la caché (SSG).
4. **Elige un título en el catálogo**: el reproductor lo recibe por el evento `mfe:play` sin que ninguno importe al otro.
5. **"tirar" un remote**: su espacio muestra un fallback y el resto sigue vivo. En la Fig 1 su módulo sale del chasis.

## Cómo está hecho

- **Module Federation** (`@module-federation/vite`): el shell declara `catalog` y `player` como remotes y los carga con
  `loadRemote()`. React y React DOM son `singleton` compartidos, así que se descargan una sola vez.
- **Fragmentos HTML**: el shell hace `fetch` al fragmento y lo inserta. En producción esto suele hacerse en el servidor
  o en el edge (ESI/SSI); aquí se hace en el navegador para que la request se vea.
- **Contrato de eventos**: `apps/shell/src/bus.js`. Es la única "API" entre catálogo y reproductor.
- **Fallos aislados**: los remotes federados van dentro de un error boundary; los fragmentos, en un `try/catch` del fetch.
  "Tirar" apunta el remote a `localhost:5999`, donde no hay nadie, así que la falla es real.

## Las figuras

`packages/figures` dibuja las dos figuras isométricas con el kit de la skill
[anatomy](https://skills.wheresryan.sh/anatomy) (MIT, copiado en `packages/figures/kit`).
`npm run figures` genera `dist/figures.js` con los SVG y páginas sueltas para revisarlas (`dist/*-light.html`).
En el shell, `src/Figures.jsx` las anima con el estado real de carga:

- **Fig 1 · El rack**: el shell es un chasis y cada remote un módulo que se enchufa cuando termina de cargar.
- **Fig 2 · Tres carriles**: SSG (páginas ya impresas), SSR (una prensa que imprime en cada request) y CSR (piezas que se
  arman en la pantalla). Los tiempos son los medidos en la página.

## Desplegar

Cada app es un deploy separado. Las URLs se configuran con variables de entorno en el build del shell
(`CATALOG_URL`, `PLAYER_URL`, `NEWS_URL`, `GUIDE_URL`, `SHELL_URL`) y con `PUBLIC_URL` en cada remote de Vite.
