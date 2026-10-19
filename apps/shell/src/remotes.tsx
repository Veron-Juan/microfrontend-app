import { Component, useEffect, useLayoutEffect, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { loadRemote, registerRemotes } from "@module-federation/runtime";
import type { RemoteMeta } from "@mfe/contracts";
import { APPS, hostOf, type AppId, type MicroFrontend } from "./registry.ts";
import { markLoad, reload, store, useStore } from "./store.ts";

/** Lo que exporta un módulo expuesto por un remote: su componente y su ficha. */
interface RemoteModule {
  default: ComponentType;
  meta?: RemoteMeta;
}

// Registramos los remotes con su URL ya resuelta. Así el mismo build funciona en localhost
// o servido desde otra carpeta, y cambiar de entorno no obliga a recompilar el shell.
registerRemotes(
  APPS.filter((app) => app.module && app.entry).map((app) => ({ name: app.id, entry: app.entry!, type: "module" })),
  { force: true },
);

// Cuenta los archivos que el navegador pidió a un origen desde un instante dado.
const filesFrom = (url: string, since: number) =>
  performance.getEntriesByType("resource").filter((entry) => entry.name.startsWith(url) && entry.startTime >= since - 1).length;

const messageOf = (error: unknown) => String((error as Error)?.message ?? error);

// Para simular una caída apuntamos el remote a un puerto donde no hay nadie.
const OFFLINE = "http://localhost:5999/";

interface BoundaryProps {
  app: MicroFrontend;
  children: ReactNode;
}

class Boundary extends Component<BoundaryProps, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown, _info: ErrorInfo) {
    markLoad(this.props.app.id, { status: "error", error: messageOf(error) });
  }
  render() {
    return this.state.error ? <Fallback app={this.props.app} error={this.state.error} /> : this.props.children;
  }
}

export function Fallback({ app, error }: { app: MicroFrontend; error: unknown }) {
  return (
    <div className="fallback" role="status">
      <span className="fallback-mark" aria-hidden="true">×</span>
      <div>
        <strong>{app.title} no está disponible</strong>
        <p>
          El shell y el resto de la página siguen funcionando. Esto es el <em>aislamiento de fallos</em>: cada remote cae solo.
        </p>
        <code>{messageOf(error).slice(0, 140)}</code>
      </div>
      <button onClick={() => reload(app.id)}>Reintentar</button>
    </div>
  );
}

// ── Remotes de Module Federation (CSR) ────────────────────────────────────────────
type Loaded = { Comp: ComponentType | null; error: unknown };

export function FederatedRemote({ app }: { app: MicroFrontend }) {
  const broken = useStore((s) => !!s.broken[app.id]);
  const nonce = useStore((s) => s.nonce[app.id] ?? 0);
  const [loaded, setLoaded] = useState<Loaded>({ Comp: null, error: null });

  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    setLoaded({ Comp: null, error: null });
    markLoad(app.id, { status: "loading", start: t0, end: null, error: null });
    const [, expose] = app.module!.split("/");
    let request: Promise<RemoteModule | null>;
    if (broken) {
      const name = `${app.id}_offline_${nonce}`;
      registerRemotes([{ name, entry: OFFLINE + "remoteEntry.js", type: "module" }]);
      request = loadRemote<RemoteModule>(`${name}/${expose}`);
    } else {
      request = loadRemote<RemoteModule>(app.module!);
    }
    request
      .then((module) => {
        if (!alive) return;
        if (!module?.default) throw new Error("El remote no expuso un componente por defecto");
        const end = performance.now();
        markLoad(app.id, { status: "ready", end, ms: Math.round(end - t0), files: filesFrom(app.url, t0), meta: module.meta });
        setLoaded({ Comp: module.default, error: null });
      })
      .catch((error: unknown) => {
        if (!alive) return;
        markLoad(app.id, { status: "error", end: performance.now(), error: messageOf(error) });
        setLoaded({ Comp: null, error });
      });
    return () => {
      alive = false;
    };
  }, [app, broken, nonce]);

  if (loaded.error) return <Fallback app={app} error={loaded.error} />;
  if (!loaded.Comp) return <Skeleton app={app} />;
  const Comp = loaded.Comp;
  return (
    <Boundary app={app} key={nonce}>
      <Mounted id={app.id} />
      <Comp />
    </Boundary>
  );
}

// ── Fragmentos HTML (SSR y SSG) ───────────────────────────────────────────────────
const HEADERS = ["x-render-mode", "x-app-version", "x-rendered-at", "x-built-at", "x-request-id", "server-timing", "cache-control", "etag", "age"];

export function FragmentRemote({ app }: { app: MicroFrontend }) {
  const broken = useStore((s) => !!s.broken[app.id]);
  const nonce = useStore((s) => s.nonce[app.id] ?? 0);
  const [result, setResult] = useState<{ html: string | null; error: unknown }>({ html: null, error: null });

  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    markLoad(app.id, { status: "loading", start: t0, end: null, error: null });
    const url = broken ? OFFLINE + "fragment" : app.entry!;
    // SSR: no-store, el servidor debe responder algo nuevo. SSG: dejamos actuar la caché HTTP.
    fetch(url, { cache: app.render === "SSR" ? "no-store" : "default" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status} desde ${hostOf(url)}`);
        const html = await response.text();
        if (!alive) return;
        const end = performance.now();
        const headers: Record<string, string> = {};
        for (const name of HEADERS) {
          const value = response.headers.get(name);
          if (value) headers[name] = value;
        }
        const timing = performance.getEntriesByName(response.url).at(-1) as PerformanceResourceTiming | undefined;
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
      .catch((error: unknown) => {
        if (!alive) return;
        markLoad(app.id, { status: "error", end: performance.now(), error: messageOf(error) });
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
function Mounted({ id }: { id: AppId }) {
  useLayoutEffect(() => {
    const end = store.get().loads[id]?.end ?? performance.now();
    const t = performance.now();
    requestAnimationFrame(() => markLoad(id, { paint: Math.max(1, Math.round(t - end)), painted: Math.round(performance.now() - end) }));
  }, [id]);
  return null;
}

function Skeleton({ app }: { app: MicroFrontend }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label={`Cargando ${app.title}`}>
      <span />
      <span />
      <span />
    </div>
  );
}
