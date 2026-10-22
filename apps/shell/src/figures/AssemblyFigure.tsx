import { useEffect, useRef } from "react";
import { FIGURES } from "@mfe/figures/figures";
import { corners, segment, translateAlong, type Plan, type Projection } from "@mfe/figures/kit";
import { appById, hostOf, remoteById, type AppId, type RemoteId } from "../mfe/registry.ts";
import { setFocus, store, useStore } from "../state/store.ts";
import { part, prefersReducedMotion, say } from "./dom.ts";
import { Plate } from "./Plate.tsx";
import { easeInOutCubic } from "./render-model.ts";
import { useAnimationLoop } from "./use-animation-loop.ts";

const { P, HOVER, TILES } = FIGURES.assembly.data;

/** Tiempos de la secuencia, en segundos. */
const SHELL_FIRST = 1.1; // la página vacía, solo con el shell
const REQUEST = 0.6; // las piezas aparecen arriba: el shell las pidió
const SPREAD = 2.4; // la pieza más lenta llega en este tiempo después de pedirla
const DROP = 0.55;
const HOLD = 3.2;
const FADE = 0.5;

interface Run {
  t: number;
  /** Cuándo baja cada pieza, según lo que tardó su remote en esta página. */
  land: Record<string, number>;
}

function startRun(): Run {
  const { loads } = store.get();
  const ms = TILES.map((tile) => loads[tile.id as AppId]?.ms ?? 1);
  const longest = Math.max(...ms, 1);
  const land = Object.fromEntries(
    TILES.map((tile, i) => [tile.id, SHELL_FIRST + REQUEST + ((ms[i] ?? 1) / longest) * SPREAD]),
  );
  return { t: 0, land };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// Fig 1: una vista explotada de la demo. El shell pone la página y cada remote baja a su hueco al llegar.
export function AssemblyFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const run = useRef<Run>(startRun());
  const settled = useStore((s) =>
    TILES.every((tile) => ["ready", "error"].includes(s.loads[tile.id as AppId]?.status ?? "idle")),
  );
  const restart = () => {
    run.current = startRun();
  };

  // La primera vuelta se arma con los tiempos medidos, así que empieza de nuevo cuando terminan las cargas.
  useEffect(() => {
    if (settled) run.current = startRun();
  }, [settled]);

  // El origen cambia con el entorno, así que se escribe al montar y no en el build.
  useEffect(() => {
    const svg = stage.current;
    if (svg) say(part(svg, "origin-shell"), `${hostOf(appById("shell").url)} · layout y navegación`);
  }, []);

  // Pasar el cursor por una pieza resalta su remote en toda la página.
  useEffect(() => {
    const svg = stage.current;
    if (!svg) return undefined;
    const enter = (event: PointerEvent) => {
      const group = (event.target as Element).closest<SVGElement>("[data-slot]");
      setFocus(group ? (group.dataset.slot as AppId) : null);
    };
    const leave = () => setFocus(null);
    svg.addEventListener("pointerover", enter);
    svg.addEventListener("pointerleave", leave);
    return () => {
      svg.removeEventListener("pointerover", enter);
      svg.removeEventListener("pointerleave", leave);
    };
  }, []);

  useAnimationLoop(stage, readout, (dt, svg, out) => {
    const { loads, focus } = store.get();
    const still = prefersReducedMotion();
    const r = run.current;
    r.t += dt;
    const t = still ? Infinity : r.t;
    const lastLand = Math.max(...Object.values(r.land));
    // Al final de la vuelta las piezas se desvanecen y la página vuelve a quedar vacía.
    const fade = still ? 1 : 1 - clamp((t - lastLand - DROP - HOLD) / FADE);
    const shown = still ? 1 : clamp((t - SHELL_FIRST) / REQUEST);

    let landed = 0;
    let latest: { id: AppId; at: number } | null = null;
    for (const tile of TILES) {
      const id = tile.id as AppId;
      const status = loads[id]?.status ?? "idle";
      const failed = status === "error";
      // Una pieza solo baja si su remote cargó de verdad: si está cargando o caído se queda arriba.
      const drop = status === "ready" ? easeInOutCubic(clamp((t - (r.land[tile.id] ?? 0)) / DROP)) : 0;
      const height = HOVER * (1 - drop);
      const home = drop === 1;
      if (home) {
        landed += 1;
        const at = r.land[tile.id] ?? 0;
        if (!latest || at > latest.at) latest = { id, at };
      }

      const group = part(svg, `tile-${tile.id}`);
      group.setAttribute("transform", translateAlong(P, [0, 0, height]));
      group.style.opacity = String((failed ? 0.4 : 1) * shown * fade);
      group.toggleAttribute("data-landed", home);
      group.querySelector(".iso-solid")?.toggleAttribute("data-lit", focus === id);
      part(svg, `ring-${tile.id}`).dataset.on = String(home);
      const app = remoteById(tile.id as RemoteId);
      say(part(svg, `meta-${tile.id}`), `${failed ? "sin respuesta" : app.render} · ${hostOf(app.url)}`);

      const lines = part(svg, `guides-${tile.id}`);
      lines.setAttribute("d", guides(P, tile.plan, height));
      lines.style.opacity = String(shown * fade);
      lines.toggleAttribute("data-flow", status === "loading" && !still);

      const shadow = part(svg, `shadow-${tile.id}`);
      shadow.style.opacity = String(drop * fade);
      part(svg, `slot-${tile.id}`).style.opacity = String(home ? 0 : 1);
      part(svg, `fail-${tile.id}`).dataset.on = String(failed && shown > 0);
    }
    say(out, readoutText(t, landed, latest?.id));
    if (!still && fade === 0) run.current = startRun();
  });

  return (
    <Plate
      fig="Fig 1"
      title="Una página, cinco servidores"
      hint="Clic para repetir"
      readoutRef={readout}
      stageRef={stage}
      svg={FIGURES.assembly.svg}
      label="Vista explotada de la demo: el shell pone la página y cada remote baja a su hueco al llegar. Activa para repetir."
      onClick={restart}
      keys={[
        { render: "SSR", label: "Novedades: HTML hecho en cada request (SSR)" },
        { render: "CSR", label: "Catálogo y Ficha: se arman en el navegador (CSR)" },
        { render: "SSG", label: "Guía: HTML generado en el build (SSG)" },
      ]}
      caption="Abajo, la página que pone el shell: el marco, la navegación y un hueco punteado por remote. Arriba, las cuatro piezas que pide, cada una a su propio servidor. Cada pieza baja a su lugar cuando llega, en el orden y con los tiempos medidos en esta página. Si tiras un servidor desde el inspector, su pieza se queda arriba, su hueco muestra el aviso y el resto de la página se arma igual."
    />
  );
}

function readoutText(t: number, landed: number, latest: AppId | undefined) {
  const { loads, focus } = store.get();
  if (focus && focus !== "shell") {
    const app = appById(focus);
    const load = loads[focus];
    const state = load?.status === "ready" ? `${load.ms} ms` : load?.status === "error" ? "caído" : "cargando";
    return `${app.title} · ${app.render} · ${state}`;
  }
  const failed = TILES.filter((tile) => loads[tile.id as AppId]?.status === "error").length;
  if (t < SHELL_FIRST) return "1 · el shell pone la página y sus huecos";
  if (landed === 0) return `2 · pide ${TILES.length} remotes, cada uno a su servidor`;
  if (landed + failed < TILES.length && latest) return `3 · llegó ${appById(latest).title} · ${landed}/${TILES.length}`;
  return failed
    ? `${landed}/${TILES.length} en su lugar · ${failed} caído, el resto funciona`
    : `${landed}/${TILES.length} remotes en su lugar`;
}

/** Las aristas verticales que unen una pieza a la altura z con su hueco, como en un plano de ensamble. */
function guides(projection: Projection, plan: Plan, z: number) {
  if (z < 0.5) return "";
  return corners(plan, 1)
    .map(([x, y]) => segment([x, y, z], [x, y, 0], projection))
    .join("");
}
