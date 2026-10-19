import { Fragment, useEffect, useState, type ReactNode } from "react";
import type { RenderMode } from "@mfe/contracts";
import "@mfe/figures/iso.css";
import { APPS, PREVIEW, REMOTES, byId, hostOf, type AppId } from "./registry.ts";
import { FederatedRemote, FragmentRemote } from "./remotes.tsx";
import { Slot } from "./Slot.tsx";
import { RackFigure, RenderFigure } from "./Figures.tsx";
import { CONTRACT, watchBus } from "./bus.ts";
import { reload, setBroken, toggleInspector, useStore, type Load } from "./store.ts";

const SECTIONS: [id: string, label: string][] = [
  ["que-es", "Qué es"],
  ["demo", "La demo en vivo"],
  ["composicion", "Cómo se compone"],
  ["render", "SSR, SSG y CSR"],
  ["comunicacion", "Comunicación"],
  ["dependencias", "Dependencias compartidas"],
  ["fallos", "Fallos aislados"],
  ["cuando", "¿Cuándo conviene?"],
];

const Remote = ({ id }: { id: AppId }) => {
  const app = byId[id];
  return app.module ? <FederatedRemote app={app} /> : <FragmentRemote app={app} />;
};

export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  const inspector = useStore((s) => s.inspector);

  useEffect(() => watchBus(), []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("mfe-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "i" && !event.metaKey && !event.ctrlKey && !/input|textarea/i.test(target?.tagName ?? "")) toggleInspector();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="iso app" data-theme={theme === "dark" ? "dark" : "light"}>
      <Slot id="shell" tools={false} className="slot-bar">
        <header className="bar">
          <a className="brand" href="#top">
            <BrandMark />
            <span>mfe<i>/</i>anatomía</span>
          </a>
          <div className="bar-right">
            <LiveCount />
            <button className="switch" role="switch" aria-checked={inspector} onClick={toggleInspector}>
              <span className="switch-track"><span /></span>
              Inspector <kbd>I</kbd>
            </button>
            <button className="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema">
              {theme === "dark" ? "Claro" : "Oscuro"}
            </button>
          </div>
        </header>
      </Slot>

      <div className="layout" id="top">
        <nav className="toc" aria-label="Lecciones">
          <ol>
            {SECTIONS.map(([id, label], index) => (
              <li key={id}>
                <a href={`#${id}`}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>
              </li>
            ))}
          </ol>
          <p className="toc-note">Pulsa <kbd>I</kbd> en cualquier momento para ver qué app sirve cada parte.</p>
        </nav>

        <main className="article">
          <Hero />
          <WhatIs />
          <Demo />
          <Composition />
          <Rendering />
          <Communication />
          <Shared />
          <Failures />
          <When />
          <Footer />
        </main>
      </div>
    </div>
  );
}

function BrandMark() {
  // Cuatro módulos en un chasis, en miniatura.
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="3" width="19" height="3" rx="1" />
      <rect x="3.5" y="8" width="3.4" height="12" rx="0.8" data-render="SSR" />
      <rect x="8.2" y="8" width="3.4" height="12" rx="0.8" data-render="CSR" />
      <rect x="12.9" y="8" width="3.4" height="12" rx="0.8" data-render="CSR" />
      <rect x="17.6" y="8" width="3.4" height="12" rx="0.8" data-render="SSG" />
    </svg>
  );
}

function LiveCount() {
  const loads = useStore((s) => s.loads);
  const ready = REMOTES.filter((app) => loads[app.id]?.status === "ready").length;
  return (
    <span className="live-count" title="Remotes cargados en esta página">
      {REMOTES.map((app) => (
        <i key={app.id} data-render={app.render} data-status={loads[app.id]?.status ?? "idle"} />
      ))}
      {ready}/{REMOTES.length}
    </span>
  );
}

interface SectionProps {
  id: string;
  n: number;
  title: string;
  kicker?: string;
  children: ReactNode;
}

function Section({ id, n, title, kicker, children }: SectionProps) {
  return (
    <section className="lesson" id={id} aria-labelledby={`${id}-t`}>
      <header className="lesson-head">
        <span className="lesson-n">{String(n).padStart(2, "0")}</span>
        <h2 id={`${id}-t`}>{title}</h2>
        {kicker && <p className="kicker">{kicker}</p>}
      </header>
      {children}
    </section>
  );
}

function Chip({ render }: { render: RenderMode }) {
  return <span className="chip" data-render={render}>{render}</span>;
}

// ── 00 · Portada ──────────────────────────────────────────────────────────────────
function Hero() {
  const inspector = useStore((s) => s.inspector);
  return (
    <section className="hero">
      {PREVIEW && (
        <p className="preview-note">
          <b>Vista previa estática.</b> Aquí no corre el servidor SSR, así que Novedades muestra una instantánea que ese servidor
          renderizó antes de publicar. Catálogo, reproductor y guía son los builds reales. Para ver el SSR en vivo, corre{" "}
          <code>npm run dev</code> en tu máquina.
        </p>
      )}
      <p className="eyebrow">Una lección que es su propio ejemplo</p>
      <h1>Anatomía de un micro-frontend</h1>
      <p className="lead">
        Esta página está hecha de <b>cinco aplicaciones independientes</b>. Cada una tiene su propio código, su propio servidor, su
        propia versión y su propia forma de renderizar. Lo que ves parece una sola app porque un <em>shell</em> las compone en vivo.
      </p>
      <div className="hero-actions">
        <button className="primary" onClick={toggleInspector}>{inspector ? "Apagar el inspector" : "Encender el inspector"}</button>
        <a className="ghost" href="#demo">Ir a la demo</a>
      </div>
      <ul className="hero-apps">
        {APPS.map((app) => (
          <li key={app.id}>
            <Chip render={app.render} />
            <b>{app.name}</b>
            <span>{hostOf(app.url)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── 01 · Qué es ───────────────────────────────────────────────────────────────────
function WhatIs() {
  return (
    <Section id="que-es" n={1} title="Qué es un micro-frontend" kicker="Microservicios, pero para la interfaz.">
      <div className="prose">
        <p>
          Una aplicación web grande se parte en <b>pedazos verticales</b>, cada uno dueño de una parte del producto (el catálogo, el
          reproductor, la guía). Cada pedazo lo construye, prueba y despliega <b>un equipo distinto</b>, sin esperar a los demás. Un
          <b> shell</b> (también llamado <em>host</em> o <em>contenedor</em>) decide dónde va cada pedazo y los une en el navegador o en
          el servidor.
        </p>
      </div>
      <div className="cards four">
        <Card title="Deploy independiente">El equipo del catálogo publica la versión 1.5 sin tocar el reproductor ni el shell.</Card>
        <Card title="Equipos autónomos">Cada equipo es dueño de su pedazo de punta a punta: código, datos, pruebas y guardia.</Card>
        <Card title="Agnóstico de tecnología">Aquí todo es React, pero un remote podría ser Vue o HTML plano. El contrato es la integración.</Card>
        <Card title="Fallos aislados">Si un remote cae, su espacio muestra un aviso y el resto de la página sigue funcionando.</Card>
      </div>
      <RackFigure />
      <div className="prose">
        <p>
          La figura es esta misma página. El chasis es el <b>shell</b>: pone el layout, el bus de eventos y la navegación. Cada módulo es
          un <b>remote</b> que se enchufa cuando termina de descargarse. Ninguno sabe que los otros existen; solo conocen el contrato del
          zócalo.
        </p>
      </div>
    </Section>
  );
}

function Card({ title, children, tag }: { title: string; children: ReactNode; tag?: ReactNode }) {
  return (
    <div className="card">
      <h3>{title} {tag}</h3>
      <p>{children}</p>
    </div>
  );
}

// ── 02 · Demo ─────────────────────────────────────────────────────────────────────
function Demo() {
  const inspector = useStore((s) => s.inspector);
  return (
    <Section id="demo" n={2} title="La demo en vivo" kicker="Una pantalla de inicio de streaming, armada con cuatro remotes.">
      <div className="prose">
        <p>
          Enciende el <b>inspector</b> y cada pieza muestra su borde, quién la sirve, desde qué origen y cuánto tardó. Con <b>↻</b> la
          vuelves a pedir y con <b>tirar</b> simulas que su servidor se cae.
        </p>
      </div>
      <div className="browser" data-inspect={inspector || undefined}>
        <div className="browser-bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="url">localhost:5000/inicio</span>
          <button className="mini" onClick={toggleInspector}>{inspector ? "inspector: on" : "inspector: off"}</button>
        </div>
        <div className="screen">
          <Slot id="shell" tools={false} className="screen-nav">
            <nav className="fake-nav">
              <b>Pantalla</b>
              <span>Inicio</span><span>En vivo</span><span>Series</span><span>Deportes</span>
              <i className="avatar" />
            </nav>
          </Slot>
          <Slot id="news"><Remote id="news" /></Slot>
          <div className="screen-row">
            <Slot id="catalog" className="grow"><Remote id="catalog" /></Slot>
            <Slot id="player" className="side"><Remote id="player" /></Slot>
          </div>
          <Slot id="guide"><Remote id="guide" /></Slot>
        </div>
      </div>
      <AppsTable />
    </Section>
  );
}

function AppsTable() {
  const loads = useStore((s) => s.loads);
  return (
    <div className="table-wrap">
      <table className="apps">
        <thead>
          <tr><th>App</th><th>Equipo</th><th>Render</th><th>Composición</th><th>Origen</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {APPS.map((app) => {
            const load: Load | undefined = app.id === "shell" ? { status: "ready" } : loads[app.id];
            return (
              <tr key={app.id}>
                <td><b>{app.name}</b> <span className="muted">@{load?.meta?.version ?? app.version}</span></td>
                <td>{app.team}</td>
                <td><Chip render={app.render} /></td>
                <td>{app.composition}</td>
                <td className="mono">{hostOf(app.url)}</td>
                <td className="mono" data-status={load?.status ?? "idle"}>
                  {load?.status === "ready" ? (app.id === "shell" ? "host" : `${load.ms} ms`) : load?.status === "error" ? "caído" : "cargando…"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── 03 · Composición ──────────────────────────────────────────────────────────────
function Composition() {
  return (
    <Section id="composicion" n={3} title="Cómo se compone" kicker="Hay cuatro formas de juntar los pedazos. Esta app usa dos.">
      <div className="cards two">
        <Card title="En el build" tag={<span className="tag">paquetes npm</span>}>
          Cada pedazo se publica como librería y el shell lo instala. Es simple, pero cada cambio obliga a re-desplegar el shell: se pierde
          el deploy independiente.
        </Card>
        <Card title="En el navegador, en runtime" tag={<span className="tag on">usado aquí</span>}>
          Con <b>Module Federation</b> el shell descarga <code>remoteEntry.js</code> de cada remote al momento de usarlo y comparte React
          con él. Así llegan el catálogo y el reproductor.
        </Card>
        <Card title="En el servidor o el edge" tag={<span className="tag on">usado aquí</span>}>
          Cada remote devuelve <b>fragmentos de HTML</b> que se insertan en la página (SSI, ESI, o un servidor de composición). Así llegan
          Novedades y la Guía.
        </Card>
        <Card title="Iframes" tag={<span className="tag">aislamiento total</span>}>
          El aislamiento más fuerte, pero pesa más, complica el diseño responsivo, la accesibilidad y la comunicación.
        </Card>
      </div>
      <Waterfall />
      <pre className="code"><code>{`// apps/shell/vite.config.ts
federation({
  name: "shell",
  remotes: {
    catalog: { type: "module", entry: "http://localhost:5001/remoteEntry.js" },
    player:  { type: "module", entry: "http://localhost:5002/remoteEntry.js" },
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
})

// apps/shell/src/remotes.tsx
const { default: Catalog } = await loadRemote<RemoteModule>("catalog/Catalog");
const html = await fetch("http://localhost:5003/fragment/news").then((r) => r.text());`}</code></pre>
    </Section>
  );
}

function Waterfall() {
  const loads = useStore((s) => s.loads);
  const rows = REMOTES.flatMap((app) => {
    const load = loads[app.id];
    return load?.start != null ? [{ app, load, start: load.start }] : [];
  });
  const t0 = Math.min(...rows.map(({ start }) => start), Infinity);
  const t1 = Math.max(...rows.map(({ load }) => load.end ?? performance.now()), t0 + 1);
  const span = Math.max(t1 - t0, 1);
  return (
    <figure className="waterfall" aria-label="Cascada de carga de los remotes">
      <figcaption>
        <span>Cascada de carga · esta página</span>
        <span className="muted">las cuatro cargas corren en paralelo</span>
      </figcaption>
      {rows.map(({ app, load, start }) => (
        <div className="wf-row" key={app.id}>
          <span className="wf-name">{app.name}</span>
          <span className="wf-track">
            <i
              data-render={app.render}
              data-status={load.status}
              style={{ left: ((start - t0) / span) * 100 + "%", width: Math.max(1.5, (((load.end ?? t1) - start) / span) * 100) + "%" }}
            />
          </span>
          <span className="wf-ms">{load.status === "ready" ? `${load.ms} ms` : load.status === "error" ? "error" : "…"}</span>
        </div>
      ))}
      {!rows.length && <p className="muted">Esperando las primeras cargas…</p>}
    </figure>
  );
}

// ── 04 · Render ───────────────────────────────────────────────────────────────────
function Rendering() {
  return (
    <Section id="render" n={4} title="SSR, SSG y CSR en la misma página" kicker="Cada remote elige la forma de renderizar que mejor le queda.">
      <div className="prose">
        <p>
          La pregunta es siempre la misma: <b>¿dónde y cuándo se convierte el componente en HTML?</b> Como cada micro-frontend se despliega
          solo, cada uno puede responderla distinto. En esta página conviven las tres respuestas.
        </p>
      </div>
      <RenderFigure />
      <div className="table-wrap">
        <table className="compare">
          <thead>
            <tr><th /><th><Chip render="SSG" /> Static Site Generation</th><th><Chip render="SSR" /> Server-Side Rendering</th><th><Chip render="CSR" /> Client-Side Rendering</th></tr>
          </thead>
          <tbody>
            <tr><th>El HTML se arma</th><td>en el build, en CI</td><td>en el servidor, en cada request</td><td>en el navegador, con JavaScript</td></tr>
            <tr><th>Datos</th><td>los del momento del build</td><td>frescos en cada request</td><td>los pide el propio navegador</td></tr>
            <tr><th>Primer contenido</th><td>muy rápido (archivo en CDN)</td><td>rápido, depende del servidor</td><td>después de bajar y ejecutar JS</td></tr>
            <tr><th>Costo de servidor</th><td>casi nulo</td><td>por cada request</td><td>solo archivos estáticos</td></tr>
            <tr><th>SEO</th><td>excelente</td><td>excelente</td><td>más difícil</td></tr>
            <tr><th>Interactividad</th><td>necesita hidratar o islas</td><td>necesita hidratar o islas</td><td>total, desde el inicio</td></tr>
            <tr><th>En esta app</th><td>Guía de programación</td><td>Novedades en vivo</td><td>Catálogo y reproductor</td></tr>
          </tbody>
        </table>
      </div>
      <Experiment />
    </Section>
  );
}

function Experiment() {
  const news = useStore((s) => s.loads.news);
  const guide = useStore((s) => s.loads.guide);
  const catalog = useStore((s) => s.loads.catalog);
  return (
    <div className="experiment">
      <h3>Experimento: pide cada uno otra vez</h3>
      <p className="muted">Mira qué cambia y qué no. Las cabeceras vienen de la respuesta real de cada servidor.</p>
      <div className="cards three">
        <ExperimentCard id="news" load={news} rows={[["x-rendered-at", "renderizado"], ["x-request-id", "request"], ["server-timing", "server-timing"], ["cache-control", "caché"]]}>
          Cada vez una hora y un id distintos: el servidor trabaja en cada request.
        </ExperimentCard>
        <ExperimentCard id="guide" load={guide} rows={[["x-built-at", "build"], ["etag", "etag"], ["cache-control", "caché"]]}>
          La hora del build y el ETag no cambian, y desde la segunda vez puede responder la caché del navegador.
        </ExperimentCard>
        <ExperimentCard id="catalog" load={catalog} rows={[]}>
          El servidor solo entrega JavaScript. El HTML lo crea React en tu navegador, en {catalog?.painted ?? "…"} ms tras la descarga.
        </ExperimentCard>
      </div>
    </div>
  );
}

interface ExperimentCardProps {
  id: AppId;
  load: Load | undefined;
  /** Cabeceras a mostrar: [nombre de la cabecera, etiqueta]. */
  rows: [header: string, label: string][];
  children: ReactNode;
}

function ExperimentCard({ id, load, rows, children }: ExperimentCardProps) {
  const app = byId[id];
  return (
    <div className="card exp">
      <h3><Chip render={app.render} /> {app.title}</h3>
      <dl>
        <dt>respuesta</dt>
        <dd>{load?.status === "ready" ? `${load.ms} ms${load.cached ? " · desde caché" : ""}` : load?.status ?? "…"}</dd>
        {id === "news" && <><dt>requests</dt><dd>{load?.count ?? 0}</dd></>}
        {rows.map(([key, label]) => (
          <Fragment key={key}>
            <dt>{label}</dt>
            <dd>{load?.headers?.[key] ?? "—"}</dd>
          </Fragment>
        ))}
        {id === "catalog" && <><dt>archivos</dt><dd>{load?.files ?? "—"} desde {hostOf(app.url)}</dd></>}
      </dl>
      <p>{children}</p>
      <button onClick={() => reload(id)}>Pedir otra vez</button>
    </div>
  );
}

// ── 05 · Comunicación ─────────────────────────────────────────────────────────────
function Communication() {
  const events = useStore((s) => s.events);
  return (
    <Section id="comunicacion" n={5} title="Comunicación entre micro-frontends" kicker="Se hablan por eventos, nunca importándose entre sí.">
      <div className="split">
        <div className="prose">
          <p>
            El catálogo y el reproductor son de equipos distintos. Cuando eliges un título, el catálogo <b>publica</b> un evento{" "}
            <code>mfe:play</code> en <code>window</code>. El reproductor lo <b>escucha</b>. Ninguno importa al otro: si mañana el
            reproductor cambia por completo, el catálogo no se entera.
          </p>
          <ul className="rules">
            <li>El contrato (nombre y forma del evento) se versiona como una API.</li>
            <li>No hay estado global compartido entre remotes. Cada uno es dueño del suyo.</li>
            <li>La URL también es un canal: filtros y rutas viven en ella.</li>
          </ul>
          <pre className="code"><code>{Object.entries(CONTRACT).map(([name, shape]) => `"${name}": ${shape}`).join("\n")}</code></pre>
        </div>
        <div className="bus" aria-live="polite">
          <div className="bus-head">
            <span>bus · window</span>
            <span className="muted">elige algo en el catálogo de la demo</span>
          </div>
          {events.length ? (
            <ol>
              {events.map((event) => (
                <li key={event.key}>
                  <span className="mono muted">{new Date(event.at).toLocaleTimeString("es", { hour12: false })}</span>
                  <b className="mono">{event.name}</b>
                  <span>{event.detail?.from} → player</span>
                  <span className="muted">{event.detail?.title}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted bus-empty">Sin eventos todavía.</p>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── 06 · Dependencias compartidas ────────────────────────────────────────────────
interface Share {
  owner: string;
  scopeName: string;
  pkg: string;
  version: string;
  from?: string;
  loaded: boolean;
  used: number;
}

function Shared() {
  const loads = useStore((s) => s.loads);
  const [shares, setShares] = useState<Share[]>([]);
  useEffect(() => {
    // Lee el registro de dependencias compartidas del runtime de Module Federation.
    const scope = globalThis.__FEDERATION__?.__SHARE__ ?? {};
    const list: Share[] = [];
    for (const [owner, scopes] of Object.entries(scope)) {
      for (const [scopeName, pkgs] of Object.entries(scopes ?? {})) {
        for (const [pkg, versions] of Object.entries(pkgs ?? {})) {
          if (!/^react/.test(pkg)) continue;
          for (const [version, info] of Object.entries(versions ?? {})) {
            list.push({ owner, scopeName, pkg, version, from: info?.from, loaded: !!(info?.loaded || info?.lib), used: info?.useIn?.length ?? 0 });
          }
        }
      }
    }
    setShares(list);
  }, [loads.catalog?.status, loads.player?.status]);
  const unique = Object.values(Object.fromEntries(shares.map((share) => [`${share.pkg}@${share.version}:${share.from}`, share])));
  return (
    <Section id="dependencias" n={6} title="Dependencias compartidas" kicker="Un solo React para todos, negociado en runtime.">
      <div className="prose">
        <p>
          Si cada remote trajera su propio React, el usuario descargaría la librería tres veces y los hooks fallarían al mezclarse. Por eso
          el shell y los remotes declaran React como <b>singleton compartido</b>: el runtime de Module Federation elige una versión
          compatible y todos usan esa misma instancia.
        </p>
      </div>
      <div className="table-wrap">
        <table className="apps">
          <thead><tr><th>Paquete</th><th>Versión</th><th>La ofrece</th><th>Cargada</th></tr></thead>
          <tbody>
            {unique.length ? (
              unique.map((share) => (
                <tr key={`${share.pkg}${share.version}${share.from}`}>
                  <td className="mono">{share.pkg}</td>
                  <td className="mono">{share.version}</td>
                  <td>{share.from}</td>
                  <td className="mono">{share.loaded ? "sí, en uso" : "registrada"}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="muted">Leyendo el registro de Module Federation…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted small">Leído en vivo de <code>__FEDERATION__.__SHARE__</code>. Catálogo y reproductor también declaran React, pero el runtime les entrega la copia que ya cargó el shell: React se descarga una sola vez.</p>
      <div className="cards three">
        <Card title="singleton">Una sola instancia en toda la página. Imprescindible para React, routers y librerías con estado global.</Card>
        <Card title="requiredVersion">Cada app dice qué rango acepta (^18.3.1). Si no hay una versión compatible, el runtime avisa.</Card>
        <Card title="El costo">Compartir acopla: subir React de versión exige coordinar a todos los equipos. Comparte lo mínimo.</Card>
      </div>
    </Section>
  );
}

// ── 07 · Fallos ───────────────────────────────────────────────────────────────────
function Failures() {
  const broken = useStore((s) => s.broken);
  const loads = useStore((s) => s.loads);
  return (
    <Section id="fallos" n={7} title="Fallos aislados" kicker="Un remote caído no debería tumbar la página.">
      <div className="prose">
        <p>
          Tira un servidor. El shell apunta ese remote a un origen donde no hay nadie, la carga falla y su espacio muestra un aviso con un
          botón para reintentar. El resto sigue funcionando: los remotes de Module Federation están envueltos en un <em>error boundary</em>{" "}
          y los fragmentos en un <code>try/catch</code> del fetch.
        </p>
      </div>
      <div className="breakers">
        {REMOTES.map((app) => (
          <button key={app.id} className="breaker" aria-pressed={!!broken[app.id]} onClick={() => setBroken(app.id, !broken[app.id])}>
            <i data-render={app.render} data-status={loads[app.id]?.status ?? "idle"} />
            <span>
              <b>{app.name}</b>
              <small>{broken[app.id] ? "caído · clic para levantar" : loads[app.id]?.status === "ready" ? "en línea · clic para tirar" : "cargando…"}</small>
            </span>
          </button>
        ))}
      </div>
      <p className="muted small">Mira la demo y la Fig 1 mientras lo haces: el módulo sale del chasis y los demás siguen enchufados.</p>
    </Section>
  );
}

// ── 08 · Cuándo ───────────────────────────────────────────────────────────────────
function When() {
  return (
    <Section id="cuando" n={8} title="¿Cuándo conviene?" kicker="Es una solución organizacional antes que técnica.">
      <div className="cards two">
        <div className="card">
          <h3>Conviene cuando…</h3>
          <ul className="rules">
            <li>Hay varios equipos trabajando sobre el mismo producto y se bloquean entre sí.</li>
            <li>Partes del sitio tienen ritmos de cambio muy distintos (la guía vs. el reproductor).</li>
            <li>Necesitas migrar de a poco una app vieja sin reescribirla de una vez.</li>
            <li>Distintas partes necesitan distintas formas de renderizar.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Cuesta…</h3>
          <ul className="rules">
            <li>Más infraestructura: varios pipelines, servidores y versiones que vigilar.</li>
            <li>Consistencia visual: hace falta un design system compartido.</li>
            <li>Rendimiento: dependencias duplicadas si no se comparten bien.</li>
            <li>Disciplina: contratos de eventos y rutas que nadie puede romper.</li>
          </ul>
        </div>
      </div>
      <dl className="glossary">
        <dt>Shell / host</dt><dd>La app que contiene y orquesta a las demás.</dd>
        <dt>Remote</dt><dd>Una app que expone pedazos para que otro los consuma.</dd>
        <dt>remoteEntry.js</dt><dd>El manifiesto que un remote publica: qué expone y qué comparte.</dd>
        <dt>Fragmento</dt><dd>Un trozo de HTML sin &lt;html&gt; ni &lt;body&gt;, listo para incrustar.</dd>
        <dt>Hidratación</dt><dd>Conectar JavaScript a un HTML que ya llegó renderizado para volverlo interactivo.</dd>
        <dt>ESI / SSI</dt><dd>Etiquetas que un CDN o servidor reemplaza por fragmentos antes de responder.</dd>
      </dl>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <p>
        Cinco servidores en tu máquina: <code>npm install</code> y luego <code>npm run dev</code>. Las figuras isométricas se dibujaron
        con el kit de la skill <a href="https://skills.wheresryan.sh/anatomy">anatomy</a> (MIT).
      </p>
    </footer>
  );
}
