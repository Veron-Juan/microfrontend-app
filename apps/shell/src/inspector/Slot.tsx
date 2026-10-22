import type { CSSProperties, ReactNode } from "react";
import { cx } from "../lib/cx.ts";
import { appById, apps, hostOf, type AppId } from "../mfe/registry.ts";
import { reload, setBroken, setFocus, useStore } from "../state/store.ts";

/**
 * Dónde va la ficha del inspector: montada sobre el borde de arriba (a la izquierda o a la
 * derecha), o debajo de la pieza (la barra del shell). Sobre el borde no empuja el contenido, así
 * que encender el inspector no mueve nada de lugar.
 */
export type TagPlacement = "start" | "end" | "below";

interface SlotProps {
  id: AppId;
  children: ReactNode;
  className?: string;
  /** Muestra los botones para volver a pedir o tirar el remote. */
  tools?: boolean;
  tag?: TagPlacement;
  /** Queda fija arriba al hacer scroll (la barra del shell). */
  sticky?: boolean;
  /** Se ve como un panel (con borde) aunque el inspector esté apagado. */
  panel?: boolean;
}

const TAG_PLACEMENT: Record<TagPlacement, string> = {
  start: "absolute top-0 left-3 -translate-y-1/2",
  end: "absolute top-0 right-3 -translate-y-1/2",
  below: "absolute top-[calc(100%+6px)] right-1",
};

/** Cuánto se demora cada pieza al encender el inspector: aparecen en cascada, en el orden de la página. */
const STAGGER_MS = 70;

/**
 * Envuelve cada pieza de la página. Con el inspector encendido dibuja su borde y su ficha:
 * quién la sirve, desde dónde, con qué tipo de render y cuánto tardó.
 */
export function Slot({
  id,
  children,
  className,
  tools = true,
  tag = "start",
  sticky = false,
  panel = false,
}: SlotProps) {
  const app = appById(id);
  const inspector = useStore((s) => s.inspector);
  const focus = useStore((s) => s.focus);
  const load = useStore((s) => s.loads[id]);
  const broken = useStore((s) => !!s.broken[id]);
  const isShell = app.kind === "host";
  const status = isShell ? "ready" : (load?.status ?? "idle");
  const focused = inspector && focus === id;
  // Al pasar el mouse por una pieza, las demás se apagan un poco. La barra fija nunca.
  const dimmed = inspector && !sticky && focus !== null && focus !== id;
  const delay = {
    animationDelay: `${
      Math.max(
        0,
        apps().findIndex((a) => a.id === id),
      ) * STAGGER_MS
    }ms`,
  };

  return (
    <div
      data-mfe={id}
      data-render={app.render}
      data-status={status}
      className={cx(
        "@container transition-[box-shadow,background-color,opacity,filter] duration-300 ease-out-soft",
        sticky ? "sticky top-0 z-20" : "relative rounded-xl",
        panel && !inspector && "ring-1 ring-line-soft",
        inspector && (isShell ? "inset-ring-[1.5px] inset-ring-mid" : "bg-(--c)/[0.045] ring-[1.5px] ring-(--c)"),
        focused && !isShell && "bg-(--c)/[0.09] ring-[2.5px]",
        dimmed && "opacity-50 saturate-[.6]",
        className,
      )}
      onPointerEnter={() => inspector && setFocus(id)}
      onPointerLeave={() => inspector && setFocus(null)}
    >
      {inspector && !sticky && <Scan delay={delay} isShell={isShell} />}
      {/* Un destello en el borde cada vez que el remote termina de cargar (por ejemplo, después de ↻). */}
      {inspector && !isShell && status === "ready" && (
        <span
          key={load?.end ?? 0}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[3px] animate-flash rounded-[15px] ring-4 ring-(--c)/45 motion-reduce:hidden"
          style={delay}
        />
      )}
      {inspector && (
        <div
          className={cx(
            "z-[5] flex w-fit max-w-[calc(100%-24px)] animate-tag-in flex-wrap items-center gap-2 rounded-md bg-card py-1 pr-1.5 pl-[5px] font-mono text-[11px] text-muted shadow-[0_6px_16px_-6px_rgb(0_0_0/.3)] motion-reduce:animate-none",
            isShell ? "ring-[1.5px] ring-mid" : "ring-[1.5px] ring-(--c)",
            focused && "shadow-[0_10px_24px_-8px_rgb(0_0_0/.4)]",
            TAG_PLACEMENT[tag],
          )}
          style={delay}
        >
          <span
            className={cx(
              "rounded-sm px-[5px] py-[3px] font-mono text-[10px]/none font-semibold text-card",
              isShell ? "bg-mid" : "bg-(--c)",
            )}
          >
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

/** Un barrido de luz del color de la pieza que la recorre una vez al encender el inspector. */
function Scan({ delay, isShell }: { delay: CSSProperties; isShell: boolean }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span
        className={cx(
          "absolute inset-y-0 -left-1/3 w-1/3 animate-scan bg-linear-90 from-transparent to-transparent motion-reduce:hidden",
          isShell ? "via-mid/20" : "via-(--c)/25",
        )}
        style={delay}
      />
    </span>
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
      className="cursor-pointer rounded-[5px] border border-line bg-transparent px-1.5 py-px font-mono text-[11px] text-strong transition-colors hover:border-mid aria-pressed:border-danger aria-pressed:text-danger"
    >
      {children}
    </button>
  );
}
