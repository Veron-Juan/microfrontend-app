import type { ReactNode } from "react";
import { byId, hostOf, type AppId } from "./registry.ts";
import { reload, setBroken, setFocus, useStore } from "./store.ts";

// Envuelve cada pieza de la página. Con el inspector encendido dibuja su borde y su ficha:
// quién la sirve, desde dónde, con qué tipo de render y cuánto tardó.
interface SlotProps {
  id: AppId;
  children: ReactNode;
  className?: string;
  /** Muestra los botones para volver a pedir o tirar el remote. */
  tools?: boolean;
}

export function Slot({ id, children, className = "", tools = true }: SlotProps) {
  const app = byId[id];
  const inspector = useStore((s) => s.inspector);
  const focus = useStore((s) => s.focus);
  const load = useStore((s) => s.loads[id]);
  const broken = useStore((s) => !!s.broken[id]);
  const status = id === "shell" ? "ready" : load?.status ?? "idle";
  return (
    <div
      className={`slot ${className}`}
      data-mfe={id}
      data-render={app.render}
      data-inspect={inspector || undefined}
      data-focus={focus === id || undefined}
      data-status={status}
      onPointerEnter={() => inspector && setFocus(id)}
      onPointerLeave={() => inspector && setFocus(null)}
    >
      {inspector && (
        <div className="slot-tag">
          <span className="slot-chip" data-render={app.render}>{app.render}</span>
          <b>{app.name}</b>
          <span>@{load?.meta?.version ?? app.version}</span>
          <span className="slot-host">{hostOf(app.url)}</span>
          {status === "ready" && load?.ms != null && <span className="slot-ms">{load.ms} ms{load.cached ? " · caché" : ""}</span>}
          {status === "loading" && <span className="slot-ms">cargando…</span>}
          {status === "error" && <span className="slot-ms slot-err">caído</span>}
          {tools && id !== "shell" && (
            <span className="slot-tools">
              <button onClick={() => reload(id)} title="Volver a pedirlo">↻</button>
              <button onClick={() => setBroken(id, !broken)} aria-pressed={broken} title="Simular que su servidor se cae">
                {broken ? "levantar" : "tirar"}
              </button>
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
