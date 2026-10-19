import React, { Component, useEffect, useLayoutEffect, useState } from "react";
import { loadRemote, registerRemotes } from "@module-federation/runtime";
import { APPS, hostOf } from "./registry.js";

// Registramos los remotes con su URL ya resuelta. Así el mismo build funciona en localhost
// o servido desde otra carpeta, y cambiar de entorno no obliga a recompilar el shell.
registerRemotes(
  APPS.filter((app) => app.module).map((app) => ({ name: app.id, entry: app.entry, type: "module" })),
  { force: true },
);
import { markLoad, reload, store, useStore } from "./store.js";

// Cuenta los archivos que el navegador pidió a un origen desde un instante dado.
const filesFrom = (url, since) =>
  performance.getEntriesByType("resource").filter((entry) => entry.name.startsWith(url) && entry.startTime >= since - 1).length;

// Para simular una caída apuntamos el remote a un puerto donde no hay nadie.
const OFFLINE = "http://localhost:5999/";

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    markLoad(this.props.app.id, { status: "error", error: String(error.message ?? error) });
  }
  render() {
    return this.state.error ? <Fallback app={this.props.app} error={this.state.error} /> : this.props.children;
  }
}

export function Fallback({ app, error }) {
  return (
    <div className="fallback" role="status">
      <span className="fallback-mark" aria-hidden="true">×</span>
      <div>
        <strong>{app.title} no está disponible</strong>
        <p>
          El shell y el resto de la página siguen funcionando. Esto es el <em>aislamiento de fallos</em>: cada remote cae solo.
        </p>
        <code>{String(error?.message ?? error).slice(0, 140)}</code>
      </div>
      <button onClick={() => reload(app.id)}>Reintentar</button>
    </div>
  );
}

// ── Remotes de Module Federation (CSR) ────────────────────────────────────────────
export function FederatedRemote({ app }) {
  const broken = useStore((s) => !!s.broken[app.id]);
  const nonce = useStore((s) => s.nonce[app.id] ?? 0);
  const [loaded, setLoaded] = useState({ Comp: null, error: null });

  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    setLoaded({ Comp: null, error: null });
    markLoad(app.id, { status: "loading", start: t0, end: null, error: null });
    let request;
    if (broken) {
      const name = `${app.id}_offline_${nonce}`;
      registerRemotes([{ name, entry: OFFLINE + "remoteEntry.js", type: "module" }]);
      request = loadRemote(`${name}/${app.module.split("/")[1]}`);
    } else {
      request = loadRemote(app.module);
    }
    request
      .then((module) => {
        if (!alive) return;
        if (!module?.default) throw new Error(`El remote no expuso un componente por defecto`);
        const end = performance.now();
        markLoad(app.id, { status: "ready", end, ms: Math.round(end - t0), files: filesFrom(app.url, t0), meta: module.meta });
        setLoaded({ Comp: () => module.default, error: null });
      })
      .catch((error) => {
        if (!alive) return;
        markLoad(app.id, { status: "error", end: performance.now(), error: String(error?.message ?? error) });
        setLoaded({ Comp: null, error });
      });
    return () => {
      alive = false;
    };
  }, [app, broken, nonce]);

  if (loaded.error) return <Fallback app={app} error={loaded.error} />;
  if (!loaded.Comp) return <Skeleton app={app} />;
  const Comp = loaded.Comp();
  return (
    <Boundary app={app} key={nonce}>
      <Mounted id={app.id} />
      <Comp />
    </Boundary>
  );
}

// ── Fragmentos HTML (SSR y SSG) ───────────────────────────────────────────────────
const HEADERS = ["x-render-mode", "x-app-version", "x-rendered-at", "x-built-at", "x-request-id", "server-timing", "cache-control", "etag", "age"];

export function FragmentRemote({ app }) {
  const broken = useStore((s) => !!s.broken[app.id]);
  const nonce = useStore((s) => s.nonce[app.id] ?? 0);
  const [result, setResult] = useState({ html: null, error: null });

  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    markLoad(app.id, { status: "loading", start: t0, end: null, error: null });
    const url = broken ? OFFLINE + "fragment" : app.entry;
    // SSR: no-store, el servidor debe responder algo nuevo. SSG: dejamos actuar la caché HTTP.
    fetch(url, { cache: app.render === "SSR" ? "no-store" : "default" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status} desde ${hostOf(url)}`);
        const html = await response.text();
        if (!alive) return;
        const end = performance.now();
        const headers = Object.fromEntries(HEADERS.map((name) => [name, response.headers.get(name)]).filter(([, value]) => value));
        const timing = performance.getEntriesByName(response.url).at(-1);
        const cached = timing ? timing.transferSize === 0 && timing.decodedBodySize > 0 : false;
        markLoad(app.id, {
          status: "ready",
          end,
          ms: Math.round(end - t0),
          files: 1,
          bytes: html.length,
          headers,
          cached,
          ttfb: timing?.responseStart ? Math.round(timing.responseStart - timing.requestStart) : null,
          count: (store.get().loads[app.id]?.count ?? 0) + 1,
        });
        setResult({ html, error: null });
      })
      .catch((error) => {
        if (!alive) return;
        markLoad(app.id, { status: "error", end: performance.now(), error: String(error?.message ?? error) });
        setResult({ html: null, error });
      });
    return () => {
      alive = false;
    };
  }, [app, broken, nonce]);

  if (result.error) return <Fallback app={app} error={result.error} />;
  if (result.html === null) return <Skeleton app={app} />;
  // El HTML llega ya renderizado: el shell solo lo inserta. No se ejecuta JS del remote.
  return <div className="fragment" dangerouslySetInnerHTML={{ __html: result.html }} />;
}

// Mide cuánto tarda React en montar el remote después de descargarlo: el "render en el cliente".
function Mounted({ id }) {
  useLayoutEffect(() => {
    const load = store.get().loads[id];
    const t = performance.now();
    requestAnimationFrame(() => markLoad(id, { paint: Math.max(1, Math.round(t - (load?.end ?? t))), painted: Math.round(performance.now() - (load?.end ?? t)) }));
  }, [id]);
  return null;
}

function Skeleton({ app }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label={`Cargando ${app.title}`}>
      <span />
      <span />
      <span />
    </div>
  );
}
