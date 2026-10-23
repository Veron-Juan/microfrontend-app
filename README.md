# Anatomy of a micro-frontend

An app that teaches micro-frontend architecture **by being a micro-frontend itself**, and that also proves
**different kinds of rendering (SSR, SSG and CSR) can live together on one page**. Five independent applications,
each with its own server, version and way of rendering, composed live by a shell. The **inspector** (press `I`) shows
which app serves each part.

```
                         ┌──────────────────────── shell :5000 (host, CSR) ────────────────────────┐
                         │  layout · lessons · inspector · event bus (window)                      │
                         │                                                                         │
 news-ssr  :5003 ──HTML──▶  [ News     ]   fragment rendered on every request            (SSR)    │
 catalog   :5001 ──JS────▶  [ Catalog  ]   Module Federation, runs in the browser         (CSR)    │
 details   :5002 ──JS────▶  [ Details  ]   Module Federation, listens for "mfe:select"    (CSR)    │
 guide-ssg :5004 ──HTML──▶  [ Guide    ]   file generated at build time, served like a CDN (SSG)   │
                         └─────────────────────────────────────────────────────────────────────────┘
```

## Running it

Requires Node 22 or later (there's an `.nvmrc`).

```bash
npm install
npm run dev      # builds the remotes and starts the 5 servers
# open http://localhost:5000
```

`npm run build && npm start` does the same, but also serves the already-built shell.

The data comes from public APIs (see [The data](#the-data-real-public-apis)). Everything keeps working offline: each
remote falls back to its own backup data and says so on screen.

| Command             | What it does                                                              |
| ------------------- | ------------------------------------------------------------------------- |
| `npm run check`     | Everything below together. It's what CI runs on every push.               |
| `npm run lint`      | ESLint (strict typescript-eslint + React hooks rules).                    |
| `npm run typecheck` | `tsc` across every package. Needs the figures built (`npm run figures`).  |
| `npm test`          | Unit tests with Node's built-in runner (`node:test`).                     |
| `npm run format`    | Prettier, which also sorts the Tailwind classes.                          |
| `npm run figures`   | Generates the isometric figures (`packages/figures/dist`). `dev` runs it. |

| App       | Port | Render | Composition                                                 | Code             |
| --------- | ---- | ------ | ----------------------------------------------------------- | ---------------- |
| shell     | 5000 | CSR    | Module Federation host                                      | `apps/shell`     |
| catalog   | 5001 | CSR    | Module Federation remote                                    | `apps/catalog`   |
| details   | 5002 | CSR    | Module Federation remote (the details page)                 | `apps/details`   |
| news-ssr  | 5003 | SSR    | HTML fragment (Express + `renderToString`)                  | `apps/news-ssr`  |
| guide-ssg | 5004 | SSG    | static HTML fragment (`renderToStaticMarkup` at build time) | `apps/guide-ssg` |

Each remote can also be opened on its own port: that's how its team would develop it, without the shell.

## Things to try

1. **Inspector** (`I`): borders per app, with version, origin and load time. Turning it on scrolls to the demo.
2. **↻ on News**: the render time and the request id change every time (SSR), but the data says "N s old": it comes
   from the server's cache.
3. **↻ on the Guide**: the build time doesn't change and the inspector shows "cache": the response came from the
   browser's HTTP cache without going to the network (SSG). Locally, the Network tab also shows the ETag doesn't change.
4. **Search the catalog**: the search goes from your browser to TVmaze (CSR). Watch it in the Network tab.
5. **Pick a title in the catalog**: the details page receives it through the `mfe:select` event, without either one
   importing the other, and fetches the rating, summary and cast from TVmaze.
6. **"Kill" a remote**: its space shows a fallback and the rest stays alive. In Fig 1 its piece stays up top and its
   slot shows the notice.
7. **Click a piece in Fig 1**: it opens what that server serves (the `mf-manifest.json` for Module Federation, the page
   for the fragments). Both figures have **Pause** and **Replay** buttons.

## TypeScript

The whole monorepo is strict TypeScript (`tsconfig.base.json`, which every package extends).

- The Vite remotes (`shell`, `catalog`, `details`) are compiled by Vite; `tsc` only checks types (`noEmit`).
- The servers (`news-ssr`, `guide-ssg`) and the figure generator run with [`tsx`](https://tsx.is), with no build step.
- **`packages/contracts`** (`@mfe/contracts`) is the only thing the teams share at compile time: the types of the bus
  events (`BusEvents`), of each remote's metadata (`RemoteMeta`) and the typed `emit()` / `on()` helpers. The catalog
  doesn't import the details page or vice versa; both import the contract. If someone changes the `mfe:select`
  payload, both remotes' typecheck fails before the deploy. Renaming the event (formerly `mfe:play`) was a breaking
  change, which is why the contract went to 2.0.
- On the shell's side, `loadRemote<RemoteModule>()` types what each remote exposes, and `__FEDERATION__` is declared in
  `apps/shell/src/vite-env.d.ts`.

## Styling: Tailwind in a micro-frontend

Tailwind CSS v4 in every app, with one rule: **share values, not CSS**.

- **`packages/design-tokens`** (`@mfe/design-tokens`) defines the palette, the typefaces and one color per kind of
  rendering as a Tailwind theme (`@theme inline`), with light and dark modes on `<html data-theme>`. It's the design
  system.
- **Each app compiles its own CSS** from those tokens. None depends on another's CSS, so a catalog deploy can't break
  the shell's styles, or vice versa.
- **Only the shell** loads Tailwind's reset (preflight). The remotes use their own **prefix** (`cat:`, `dtl:`, `nws:`,
  `gde:`) and bring no reset: their classes never clash with the shell's or another remote's.
- The Vite remotes import their CSS as text (`import styles from "./catalog.css?inline"`) and render it inside their
  component, so it travels with the module through Module Federation. The SSR and SSG ones compile it with
  `compileTailwind()` (`@mfe/design-tokens/compile`) and embed it in the HTML fragment.
- The cost: everyone must use the same major version of Tailwind, because they share its internal variables
  (`--tw-*`).

## How the shell is organized

```
apps/shell/src
├── main.tsx          registers the remotes and mounts the app
├── App.tsx           the page layout
├── mfe/              everything micro-frontend: registry, Module Federation, fragments, fallback, CSP
├── inspector/        each piece's border and tag (Slot) and the remote counter
├── figures/          the two animated figures, their model (with tests) and the animation loop
├── lessons/          one lesson section per file, and the index that numbers them
├── layout/           top bar, side index, theme and keyboard shortcut
├── ui/               small reusable components (Button, Card, Chip, Table…)
├── state/            the shell's minimal store (with tests)
└── lib/              pure utilities (with tests)
```

`apps/shell/scripts/discovery.ts` generates the production discovery (see [Deploying](#deploying)).

## How it's built

- **Discovery**: the shell doesn't compile in its remotes' URLs. At startup it reads `remotes.json` (see below),
  validates its shape (`mfe/discovery.ts`) and builds its registry (`mfe/registry.ts`).
- **Module Federation** (`@module-federation/vite`): the shell registers `catalog` and `details` at runtime with
  `registerRemotes()`, using the `mf-manifest.json` each one publishes, and loads them with `loadRemote()`. React and
  React DOM are shared `singleton`s, so they're downloaded only once.
- **HTML fragments**: the shell `fetch`es the fragment and inserts it. In production this is usually done on the
  server or at the edge (ESI/SSI); here it happens in the browser so you can see the request.
- **Event contract**: `packages/contracts/index.ts`. It's the only "API" between catalog and details, which talk over
  `window` without going through the shell.
- **Isolated failures**: if a remote's download fails (module or fragment), the shell catches the promise rejection
  and shows the fallback (`mfe/use-remote-request.ts`). If a federated remote fails while rendering, an error boundary
  catches it (`mfe/RemoteBoundary.tsx`). "Kill" points the remote at `offline.invalid`, a reserved domain that never
  resolves, so the failure is real.

## The data: real public APIs

Each remote gets its data in the way that matches how it renders. No API needs a key or an account.

| Remote      | API                                                                                      | When it's queried                                            | If it fails                                  |
| ----------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `guide-ssg` | [TVmaze](https://www.tvmaze.com/api) `/shows/169?embed=episodes`: Breaking Bad           | **Once, at build time** (with one retry)                     | Uses the copy in the repo (`snapshot.json`)  |
| `news-ssr`  | [TheSportsDB](https://www.thesportsdb.com) (today's football) and TVmaze `/schedule/web` | **On the server**, with a 60 s in-memory cache               | That section shows a notice; the other stays |
| `catalog`   | TVmaze `/shows` (the most popular) and `/search/shows` (the search box)                  | **In your browser**: it's CSR, the request shows in DevTools | Shows the fallback catalog (`shows.ts`)      |
| `details`   | TVmaze `/shows/:id` with cast and seasons, for the title you picked                      | **In your browser**, on receiving `mfe:select`; cached       | Shows only the data the event brought        |

What each case teaches:

- **SSG**: the data is frozen at build time, so SSG suits data that changes little or not at all. The guide shows the
  episodes of a show that has ended: its data doesn't change, and the guide is only rebuilt when its code changes. The
  build refuses to publish a show that's still airing (`seriesProblems`), because it would go stale without anyone
  noticing. If the API is down at build time, it uses the copy stored in the repo, which has the same data
  (`npm run snapshot -w guide-ssg` regenerates it).
- **SSR**: the HTML is new on every request, but the data doesn't need to be fetched every time
  (`news-ssr/src/cache.ts`). Simultaneous requests share one call, and if the API fails the last good value is used
  (_stale-if-error_). Each API has its own timeout and both are fetched in parallel: one outage degrades a section, not
  the whole fragment. The cache is warmed up at startup.
- **CSR**: the browser talks to the API directly, so it only works with a public API that has CORS and no secrets.
  With a key (TMDB, for example) you'd have to go through your own backend, because any key in the browser is public.
- **Third-party data**: everything is validated on the way in (`parseSeries`, `parseEvents`, `toShow`,
  `parseDetails`…) and only names and `https` images are used. TVmaze's summary arrives as HTML and the details page
  turns it into plain text (`summaryText`). React escapes the text before the shell inserts the fragment with
  `innerHTML`.
- **Attribution**: TVmaze (CC BY-SA) and TheSportsDB are credited with a link in every remote that uses them.

TheSportsDB uses its public test key (`123`), which returns few matches per day. To use your own key, pass
`SPORTSDB_KEY` to the server. The guide uses `GUIDE_SHOW_ID` (the show's TVmaze id, `169` by default); if you change
it, regenerate the copy.

## Security and usage limits

The deployment runs on free plans, so it defends itself against abuse and injected content:

- **Content-Security-Policy** in the shell: `npm run discovery -w shell` builds it from the same origins as the
  discovery (`mfe/csp.ts`) and appends it to the build's `_headers`. The page only runs code from the shell and the
  federated remotes, only connects to the remotes and TVmaze, and allows `index.html`'s inline script by its hash. A
  `<script>` or an `onerror` inside an HTML fragment wouldn't run.
- **Security headers** on every app: `X-Content-Type-Options: nosniff`, and the shell and `news-ssr` also send
  `X-Frame-Options: DENY` and a strict `Referrer-Policy`. The static apps set them in `public/_headers`.
- **Usage limit in `news-ssr`** (`src/limits.ts`): a token bucket for the whole server (bursts of 30, 1 per second,
  8000 renders per day). Over the limit it responds `429` with `Retry-After`, the shell shows News's fallback and the
  rest of the page carries on. `/health` isn't limited. With that daily cap, outbound traffic stays below Render's
  free 5 GB per month.

## The figures

`packages/figures` draws the two isometric figures with the kit from the
[anatomy](https://skills.wheresryan.sh/anatomy) skill (MIT, copied to `packages/figures/kit`). `npm run figures`
(`tsx build.ts`) generates `dist/figures.js` and its types (`dist/figures.d.ts`) with the SVGs, plus standalone pages
to review them (`dist/*-light.html`). In the shell, `src/figures/` animates them with the real load state:

- **Fig 1 · One page, five servers**: an exploded view of the demo. The shell lays out the page with a slot per
  remote, and each remote drops into its slot when it finishes loading, with the timings measured on the page. Each
  piece is a link to what its server serves.
- **Fig 2 · Where and when the HTML is built**: a grid with the build, the server and the browser as columns and SSG,
  SSR and CSR as rows. Each row's pieces come together into a page in a single cell (the build, the server or the
  browser), and the lit cells form a diagonal. The timings are the ones measured on the page.

## How SSR, SSG and CSR are handled in a real project

This app follows the split you see in most projects:

| Decision                         | Who makes it          | Where it lives                                                         |
| -------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| How it renders (SSR, SSG or CSR) | Each remote's team    | In its own code or framework. Here: Express, the build script or Vite. |
| Where it lives and which version | The remote's pipeline | The discovery: `apps/shell/public/remotes.json`                        |
| Which remote goes where          | The shell team        | The shell's layout: `SLOTS` in `apps/shell/src/mfe/registry.ts`        |
| How long each page stays cached  | Each remote's team    | `Cache-Control` headers and CDN rules                                  |

With a framework, rendering is declared per route. In Next.js, `export const dynamic = "force-static"` is SSG and
`export const revalidate = 3600` is ISR. In Nuxt it goes in `routeRules` (`{ "/guide": { prerender: true } }`). In
Astro it's `export const prerender = true`. The shell never configures it: it only observes it, through the
`X-Render-Mode` header or the discovery's `metadata`.

## Deploying

Each app is a separate deploy, and the shell is built **once for every environment**:

1. Each remote is published to its own origin (`PUBLIC_URL` sets where the Vite ones are served from).
2. Its pipeline updates its entry in that environment's `remotes.json`: the URL of the `mf-manifest.json` or the
   fragment, the version and the metadata. In production that file is usually served by a discovery service or a CDN;
   this project's format is inspired by the "Frontend Discovery" schema AWS published.
3. The shell reads it at startup, so shipping or rolling back a remote doesn't require redeploying the shell.

`SHELL_BASE` sets the shell's base path if it isn't served from `/`.

### One concrete way to deploy it (on free plans)

Four apps are static files and go to static hosting; only `news-ssr` needs a server. The static ones ship a `_headers`
file (CORS, caching and security) that Cloudflare (Pages or Workers) and Netlify both understand. Every command runs
from the repo root.

| App         | Where                                | Build                                                                     | Publishes              | Variables                          |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------- | ---------------------- | ---------------------------------- |
| `catalog`   | Cloudflare or Netlify                | `npm run build -w catalog`                                                | `apps/catalog/dist`    | `PUBLIC_URL=https://<its-origin>/` |
| `details`   | Cloudflare or Netlify                | `npm run build -w details`                                                | `apps/details/dist`    | `PUBLIC_URL=https://<its-origin>/` |
| `guide-ssg` | Cloudflare or Netlify                | `npm run build -w guide-ssg`                                              | `apps/guide-ssg/dist`  | optional: `GUIDE_SHOW_ID`          |
| `news-ssr`  | Render, Fly.io, Railway or Cloud Run | `docker build -f apps/news-ssr/Dockerfile .`                              | the container (`PORT`) | optional: `SPORTSDB_KEY`, `TZ`     |
| `shell`     | Cloudflare or Netlify                | `npm run figures && npm run build -w shell && npm run discovery -w shell` | `apps/shell/dist`      | `MFE_*_ORIGIN` (below)             |

**How this repo does it:** the four static apps go to Cloudflare and `news-ssr` to Render, both on free plans.

- **Cloudflare**: each static app has a `wrangler.jsonc` and is published as a Worker with static assets (the current
  version of Pages), at `https://mfe-anatomia-<name>.<subdomain>.workers.dev` (`shell`, `catalog`, `details` and
  `guide`). The `deploy` job in `.github/workflows/ci.yml` runs on every push to `main`, after CI passes: it builds and
  publishes the remotes first and the shell last, with its discovery. It needs two secrets (`CLOUDFLARE_API_TOKEN`,
  created with the _Edit Cloudflare Workers_ template, and `CLOUDFLARE_ACCOUNT_ID`) and the repo variables
  `MFE_{NEWS,CATALOG,DETAILS,GUIDE}_ORIGIN`; it's skipped until they're set. To publish by hand:
  `npx wrangler deploy --cwd apps/<app>` after the build.
- **Render**: `render.yaml` is a Blueprint (New → Blueprint in Render). It redeploys by itself only when a push to
  `main` touches `news-ssr` or its dependencies. On the free plan it sleeps after 15 minutes without visits: the next
  visit waits about a minute, and meanwhile News shows its skeleton.
- **The production discovery** is generated by `npm run discovery -w shell` (`apps/shell/scripts/discovery.ts`) from
  `MFE_NEWS_ORIGIN`, `MFE_CATALOG_ORIGIN`, `MFE_DETAILS_ORIGIN` and `MFE_GUIDE_ORIGIN` (`https`, or `localhost`), plus
  `MFE_ENVIRONMENT` (`production` by default). It takes each version from its `package.json` and validates the result
  with the same parser the shell uses, so a broken discovery fails the deploy rather than the browser. It also
  generates the Content-Security-Policy. Here the shell's deploy generates it because everything lives in one repo;
  with separate teams, each pipeline would update only its own entry.
- **`news-ssr` in Docker**: it compiles the CSS at startup, warms up the cache, answers `/health` (used by the
  `HEALTHCHECK`) and shuts down gracefully on `SIGTERM`, which is what the host does on every deploy. It runs the
  TypeScript with `tsx`: JSX can't run with Node's native _type stripping_. Its time zone (the one used for match
  kickoff times) is set with `TZ`.
- **Still pending for a real product**: composing the fragments on the server or at the edge, so the SSR and SSG HTML
  arrives in the first document and search engines can see it.
