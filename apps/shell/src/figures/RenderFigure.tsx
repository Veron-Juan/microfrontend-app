import { useEffect, useRef } from "react";
import { FIGURES } from "@mfe/figures/figures";
import { translateAlong } from "@mfe/figures/kit";
import { store, useStore } from "../state/store.ts";
import { part, prefersReducedMotion, say } from "./dom.ts";
import { Plate } from "./Plate.tsx";
import { easeInOutCubic, laneTotal, renderModel, type RenderModel } from "./render-model.ts";
import { useAnimationLoop } from "./use-animation-loop.ts";

const { P, LANES, START, END, PLUNGER_REST, PLUNGER_LOW } = FIGURES.render.data;

/** Cámara lenta: el carril más lento tarda esto en pantalla, en ms. */
const SLOW_MOTION_MS = 3200;
/** Pausa con todo terminado antes de repetir la carrera, en segundos. */
const HOLD_SECONDS = 2.4;

interface Run {
  t: number;
  model: RenderModel | null;
  scale: number;
  hold: number;
}

function startRun(): Run {
  const model = renderModel(store.get().loads);
  const longest = Math.max(...Object.values(model).map(laneTotal), 1);
  return { t: 0, model, scale: SLOW_MOTION_MS / longest, hold: 0 };
}

// Fig 2: SSR, SSG y CSR como tres carriles, animados con los tiempos medidos en esta página.
export function RenderFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const run = useRef<Run>({ t: 0, model: null, scale: 1, hold: 0 });
  const ready = useStore((s) => (["news", "guide", "catalog"] as const).every((id) => s.loads[id]?.status === "ready"));
  const restart = () => {
    run.current = startRun();
  };

  useEffect(() => {
    if (ready) run.current = startRun();
  }, [ready]);

  useAnimationLoop(stage, readout, (dt, svg, out) => {
    const r = run.current;
    if (!r.model) {
      say(out, "esperando las primeras cargas…");
      return;
    }
    const still = prefersReducedMotion();
    r.t += dt * 1000;
    let done = 0;
    const totals: string[] = [];
    for (const lane of LANES) {
      const m = r.model[lane.id];
      const t = still ? Infinity : r.t / r.scale; // tiempo "real" simulado, en ms
      const server = m.server;
      const arrive = server + m.transfer;
      const end = arrive + m.browser;
      const travel = Math.min(1, Math.max(0, (t - server) / Math.max(m.transfer, 0.001)));
      part(svg, `car-${lane.id}`).setAttribute(
        "transform",
        translateAlong(P, [(END - START) * easeInOutCubic(travel), 0, 0]),
      );

      if (lane.id === "SSR") {
        // La prensa baja y sube durante el tiempo de servidor.
        const press = server ? Math.min(1, Math.max(0, t / server)) : 1;
        const depth = t < server ? Math.sin(Math.PI * press) : 0;
        part(svg, "plunger-SSR").setAttribute(
          "transform",
          translateAlong(P, [0, 0, -(PLUNGER_REST - PLUNGER_LOW) * depth]),
        );
        const printed = t >= server * 0.5;
        part(svg, "blank-SSR").dataset.on = String(!printed);
        part(svg, "page-SSR").dataset.on = String(printed);
      }
      if (lane.id === "CSR") part(svg, "blocks-CSR").dataset.on = String(t < arrive + m.browser * 0.5);

      // SSR y SSG llegan pintados; CSR pinta fila por fila mientras corre su JavaScript.
      const rows = part(svg, `paint-${lane.id}`).querySelectorAll<SVGElement>("[data-row]");
      rows.forEach((row, i) => {
        const on = lane.id === "CSR" ? t >= arrive + (m.browser * (i + 1)) / rows.length : t >= arrive;
        row.dataset.on = String(on);
      });
      part(svg, `led-${lane.id}`).dataset.on = String(t >= end);
      if (t >= end) done += 1;
      totals.push(`${lane.id} ${Math.round(end)} ms`);
    }
    say(out, totals.join(" · "));
    if (done === LANES.length && !still) {
      r.hold += dt;
      if (r.hold > HOLD_SECONDS) run.current = startRun();
    }
  });

  return (
    <Plate
      fig="Fig 2"
      title="Dónde y cuándo se arma el HTML"
      hint="Clic para repetir la carrera"
      readoutRef={readout}
      stageRef={stage}
      svg={FIGURES.render.svg}
      label="Tres carriles: SSR, SSG y CSR. Activa para repetir la carrera."
      onClick={restart}
      keys={[
        { render: "SSR", label: "Prensa: imprime la página en cada request" },
        { render: "SSG", label: "Cargador: páginas ya impresas en el build" },
        { render: "CSR", label: "Caja de piezas: la página se arma en el navegador" },
      ]}
      caption="Izquierda: el servidor. Derecha: tu pantalla. Los tiempos de la esquina se midieron en esta página al cargar Novedades (SSR), la Guía (SSG) y el Catálogo (CSR), y se reproducen en cámara lenta. Vuelve a pedir un remote desde el inspector y la carrera usa los números nuevos."
    />
  );
}
