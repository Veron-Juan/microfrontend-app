import type { ReactNode } from "react";
import { cx } from "../lib/cx.ts";
import { appById, hostOf, type AppId } from "../mfe/registry.ts";
import { reload, setBroken, setFocus, useStore } from "../state/store.ts";

/** Dónde va la ficha del inspector: arriba a la izquierda (remotes), en una esquina o debajo (piezas del shell). */
export type TagPlacement = "inline" | "corner" | "below";

interface SlotProps {
  id: AppId;
  children: ReactNode;
  className?: string;
  /** Muestra los botones para volver a pedir o tirar el remote. */
  tools?: boolean;
  tag?: TagPlacement;
  /** Queda fija arriba al hacer scroll (la barra del shell). */
  sticky?: boolean;
}

const TAG_PLACEMENT: Record<TagPlacement, string> = {
  inline: "relative -mt-[15px] -ml-[15px] mb-3 rounded-tl-[9px] rounded-br-[9px]",
  corner:
    "absolute right-1 bottom-1 rounded-md opacity-95 max-[560px]:relative max-[560px]:inset-auto max-[560px]:mt-2",
  below: "absolute top-[calc(100%+6px)] right-1 rounded-md opacity-95",
};

/**
 * Envuelve cada pieza de la página. Con el inspector encendido dibuja su borde y su ficha:
 * quién la sirve, desde dónde, con qué tipo de render y cuánto tardó.
 */
export function Slot({ id, children, className, tools = true, tag = "inline", sticky = false }: SlotProps) {
  const app = appById(id);
  const inspector = useStore((s) => s.inspector);
  const focused = useStore((s) => s.focus === id);
  const load = useStore((s) => s.loads[id]);
  const broken = useStore((s) => !!s.broken[id]);
  const isShell = app.kind === "host";
  const status = isShell ? "ready" : (load?.status ?? "idle");

  return (
    <div
      data-mfe={id}
      data-render={app.render}
      data-status={status}
      className={cx(
        "@container transition-[box-shadow,background-color] duration-250",
        sticky ? "sticky top-0 z-20" : "relative rounded-[10px]",
        inspector && (isShell ? "inset-ring-[1.5px] inset-ring-mid" : "bg-(--c)/5 ring-[1.5px] ring-(--c)"),
        inspector && focused && !isShell && "bg-(--c)/10 ring-[2.5px]",
        className,
      )}
      onPointerEnter={() => inspector && setFocus(id)}
      onPointerLeave={() => inspector && setFocus(null)}
    >
      {inspector && (
        <div
          className={cx(
            "z-[5] flex w-fit max-w-[calc(100%+2px)] animate-tag-in flex-wrap items-center gap-2 bg-card py-1 pr-1.5 pl-[5px] font-mono text-[11px] text-muted",
            isShell ? "ring-[1.5px] ring-mid" : "ring-[1.5px] ring-(--c)",
            TAG_PLACEMENT[tag],
          )}
        >
          <span className="rounded-sm bg-(--c) px-[5px] py-[3px] font-mono text-[10px]/none font-semibold text-card">
            {app.render}
          </span>
          <b className="font-medium">{app.name}</b>
          <span>@{load?.meta?.version ?? app.version}</span>
          <span className="opacity-85 @max-[440px]:hidden">{hostOf(app.url)}</span>
          {status === "ready" && load?.ms != null && (
            <span className="text-strong">
              {load.ms} ms{load.cached ? " · caché" : ""}
            </span>
          )}
          {status === "loading" && <span className="text-strong">cargando…</span>}
          {status === "error" && <span className="text-danger">caído</span>}
          {tools && !isShell && (
            <span className="inline-flex gap-1">
              <SlotTool onClick={() => reload(id)} title="Volver a pedirlo">
                ↻
              </SlotTool>
              <SlotTool onClick={() => setBroken(id, !broken)} pressed={broken} title="Simular que su servidor se cae">
                {broken ? "levantar" : "tirar"}
              </SlotTool>
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface SlotToolProps {
  onClick: () => void;
  title: string;
  pressed?: boolean;
  children: ReactNode;
}

function SlotTool({ onClick, title, pressed, children }: SlotToolProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={pressed}
      className="cursor-pointer rounded-[5px] border border-line bg-transparent px-1.5 py-px font-mono text-[11px] text-strong aria-pressed:border-danger aria-pressed:text-danger"
    >
      {children}
    </button>
  );
}
