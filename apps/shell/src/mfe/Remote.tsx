import { useLayoutEffect } from "react";
import { markLoad, store } from "../state/store.ts";
import { Fallback } from "./Fallback.tsx";
import { filesRequestedFrom, loadFederatedModule, type RemoteModule } from "./federation.ts";
import { fetchFragment, type Fragment } from "./fragments.ts";
import { remoteById, type AppId, type FederatedApp, type FragmentApp, type RemoteId } from "./registry.ts";
import { RemoteBoundary } from "./RemoteBoundary.tsx";
import { Skeleton } from "./Skeleton.tsx";
import { useRemoteRequest, type RemoteLoader } from "./use-remote-request.ts";

/** Monta el remote que corresponde a un id, eligiendo cómo componerlo según su tipo. */
export function Remote({ id }: { id: RemoteId }) {
  const app = remoteById(id);
  return app.kind === "federated" ? <FederatedRemote app={app} /> : <FragmentRemote app={app} />;
}

// ── Module Federation (CSR) ──────────────────────────────────────────────────────
const federatedLoader: RemoteLoader<FederatedApp, RemoteModule> = {
  request: (app, options) => loadFederatedModule(app, options),
  measure: (app, module, { start }) => ({ files: filesRequestedFrom(app.url, start), meta: module.meta }),
};

function FederatedRemote({ app }: { app: FederatedApp }) {
  const { result, attempt } = useRemoteRequest(app, federatedLoader);
  if (result.status === "loading") return <Skeleton label={app.title} />;
  if (result.status === "error") return <Fallback app={app} error={result.error} />;
  const Component = result.value.default;
  return (
    <RemoteBoundary app={app} key={attempt}>
      <PaintTimer id={app.id} />
      <Component />
    </RemoteBoundary>
  );
}

// Mide cuánto tarda React en montar el remote después de descargarlo: el "render en el cliente".
function PaintTimer({ id }: { id: AppId }) {
  useLayoutEffect(() => {
    const end = store.get().loads[id]?.end ?? performance.now();
    const mounted = performance.now();
    requestAnimationFrame(() =>
      markLoad(id, { paint: Math.max(1, Math.round(mounted - end)), painted: Math.round(performance.now() - end) }),
    );
  }, [id]);
  return null;
}

// ── Fragmentos HTML (SSR y SSG) ──────────────────────────────────────────────────
const fragmentLoader: RemoteLoader<FragmentApp, Fragment> = {
  request: (app, options) => fetchFragment(app, options),
  measure: (app, fragment) => ({
    files: 1,
    bytes: fragment.html.length,
    headers: fragment.headers,
    cached: fragment.cached,
    ttfb: fragment.ttfb,
    count: (store.get().loads[app.id]?.count ?? 0) + 1,
  }),
};

function FragmentRemote({ app }: { app: FragmentApp }) {
  const { result } = useRemoteRequest(app, fragmentLoader);
  if (result.status === "loading") return <Skeleton label={app.title} />;
  if (result.status === "error") return <Fallback app={app} error={result.error} />;
  // El HTML llega ya renderizado: el shell solo lo inserta. No se ejecuta JS del remote.
  return <div dangerouslySetInnerHTML={{ __html: result.value.html }} />;
}
