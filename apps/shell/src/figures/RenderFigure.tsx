import { useEffect, useRef } from "react";
import { FIGURES } from "@mfe/figures/figures";
import { translateAlong, type Point3 } from "@mfe/figures/kit";
import { store, useStore } from "../state/store.ts";
import { part, prefersReducedMotion, say } from "./dom.ts";
import { Plate } from "./Plate.tsx";
import { easeInOutCubic, laneTotal, renderModel, type RenderModel } from "./render-model.ts";
import { useAnimationLoop } from "./use-animation-loop.ts";

const { P, LANES, COLUMNS, LOOSE, TIGHT } = FIGURES.render.data;

/** La secuencia, en segundos. El build y la request son iguales para todos; la respuesta usa los tiempos medidos. */
const APPEAR: [number, number] = [0.2, 0.7];
const SSG_BUILD: [number, number] = [0.9, 2.1];
const DEPLOY: [number, number] = [2.4, 3.2];
const REQUEST: [number, number] = [3.5, 4.2];
const RESPONSE = 4.3;
/** Cada fase de la respuesta dura al menos MIN_PHASE y como mucho MIN_PHASE + SPREAD, según lo que midió. */
const MIN_PHASE = 0.45;
const SPREAD = 1.6;
/** Armar la página se ve siempre, aunque en el navegador tarde pocos milisegundos. */
const MIN_ASSEMBLY = 0.9;
const HOLD = 3.4;
const FADE = 0.6;

interface Timeline {
  /** Cuándo empieza y termina de armarse la página en cada fila. */
  assemble: [number, number];
  /** Cuándo viaja del servidor al navegador. */
  travel: [number, number];
  end: number;
}

interface Run {
  t: number;
  model: RenderModel;
  lanes: Record<string, Timeline>;
  end: number;
}

function startRun(): Run {
  const model = renderModel(store.get().loads);
  const phases = LANES.flatMap((lane) => [model[lane.id].server, model[lane.id].transfer, model[lane.id].browser]);
  const longest = Math.max(...phases, 1);
  const span = (ms: number) => MIN_PHASE + (ms / longest) * SPREAD;
  const lanes: Record<string, Timeline> = {};
  for (const lane of LANES) {
    const m = model[lane.id];
    if (lane.builds === "build") {
      // SSG: la página ya estaba hecha. Sale del servidor apenas llega la request.
      const travel: [number, number] = [RESPONSE, RESPONSE + span(m.transfer)];
      lanes[lane.id] = { assemble: SSG_BUILD, travel, end: travel[1] };
    } else if (lane.builds === "server") {
      // SSR: el servidor la arma al recibir la request y después la envía.
      const assemble: [number, number] = [RESPONSE, RESPONSE + Math.max(span(m.server), MIN_ASSEMBLY)];
      const travel: [number, number] = [assemble[1], assemble[1] + span(m.transfer)];
      lanes[lane.id] = { assemble, travel, end: travel[1] };
    } else {
      // CSR: viajan las piezas sueltas y la página se arma en el navegador.
      const travel: [number, number] = [RESPONSE, RESPONSE + span(m.transfer)];
      const assemble: [number, number] = [travel[1], travel[1] + Math.max(span(m.browser), MIN_ASSEMBLY)];
      lanes[lane.id] = { assemble, travel, end: assemble[1] };
    }
  }
  return { t: 0, model, lanes, end: Math.max(...Object.values(lanes).map((lane) => lane.end)) };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const progress = (t: number, [from, to]: [number, number]) => clamp((t - from) / Math.max(to - from, 0.001));
const mix = (a: Point3, b: Point3, f: number): Point3 => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];

// Fig 2: dónde y cuándo se arma el HTML en SSG, SSR y CSR, con los tiempos medidos en esta página.
export function RenderFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const run = useRef<Run>(startRun());
  const ready = useStore((s) => (["news", "guide", "catalog"] as const).every((id) => s.loads[id]?.status === "ready"));
  const restart = () => {
    run.current = startRun();
  };

  useEffect(() => {
    if (ready) run.current = startRun();
  }, [ready]);

  useAnimationLoop(stage, readout, (dt, svg, out) => {
    const r = run.current;
    const still = prefersReducedMotion();
    r.t += dt;
    const t = still ? Infinity : r.t;
    const fade = still ? 1 : 1 - clamp((t - r.end - HOLD) / FADE);
    const shown = still ? 1 : progress(t, APPEAR);

    for (const lane of LANES) {
      const plan = r.lanes[lane.id];
      if (!plan) continue;
      // Dónde está: en el build, en el servidor después del deploy y en el navegador después del viaje.
      const deploy = easeInOutCubic(progress(t, DEPLOY));
      const travel = easeInOutCubic(progress(t, plan.travel));
      const x = (COLUMNS.server - COLUMNS.build) * deploy + (COLUMNS.browser - COLUMNS.server) * travel;
      const content = part(svg, `content-${lane.id}`);
      content.setAttribute("transform", translateAlong(P, [x, 0, 0]));
      content.style.opacity = String(shown * fade);

      // Armarse: las piezas se juntan en una grilla y la grilla se vuelve una página.
      const span = plan.assemble[1] - plan.assemble[0];
      const join = easeInOutCubic(progress(t, [plan.assemble[0], plan.assemble[0] + span * 0.6]));
      const become = progress(t, [plan.assemble[0] + span * 0.6, plan.assemble[1]]);
      LOOSE.forEach((loose, i) => {
        part(svg, `cube-${lane.id}-${i}`).setAttribute(
          "transform",
          translateAlong(P, mix(loose, TIGHT[i] ?? loose, join)),
        );
      });
      part(svg, `cubes-${lane.id}`).style.opacity = String(1 - become);
      part(svg, `page-${lane.id}`).style.opacity = String(become);
      part(svg, `cell-${lane.id}`).dataset.on = String(become > 0.5 && fade > 0);
      part(svg, `screen-${lane.id}`).dataset.on = String(t >= plan.end && fade > 0);

      // La request: un punto que va del navegador al servidor. SSG no la espera para armarse.
      const request = progress(t, REQUEST);
      const dot = part(svg, `req-${lane.id}`);
      dot.setAttribute(
        "transform",
        translateAlong(P, [(COLUMNS.server - COLUMNS.browser) * easeInOutCubic(request), 0, 0]),
      );
      dot.dataset.on = String(request > 0 && request < 1);
    }

    say(out, readoutText(t, r));
    if (!still && fade === 0) run.current = startRun();
  });

  return (
    <Plate
      fig="Fig 2"
      title="Dónde y cuándo se arma el HTML"
      hint="Clic para repetir"
      readoutRef={readout}
      stageRef={stage}
      svg={FIGURES.render.svg}
      label="Cuadrícula de render: columnas build, servidor y navegador; filas SSG, SSR y CSR. Activa para repetir."
      onClick={restart}
      keys={[
        { render: "SSG", label: "SSG: se arma en el build, antes de cualquier request" },
        { render: "SSR", label: "SSR: se arma en el servidor, en cada request" },
        { render: "CSR", label: "CSR: viajan las piezas y se arma en tu navegador" },
      ]}
      caption="Columnas: dónde y cuándo. Filas: los tres tipos de render. Cada fila lleva piezas sueltas (componentes y datos) que se juntan en una página en una sola celda, la que se enciende. Primero el build, después el deploy y al final la request, con los tiempos que se midieron en esta página al cargar la Guía (SSG), Novedades (SSR) y el Catálogo (CSR). Vuelve a pedir un remote desde el inspector y la figura usa los números nuevos."
    />
  );
}

function readoutText(t: number, r: Run) {
  if (t < SSG_BUILD[0]) return "1 · build: todavía no hay ninguna request";
  if (t < DEPLOY[0]) return "1 · build: SSG arma su HTML ahora, una sola vez";
  if (t < REQUEST[0]) return "2 · deploy: todo queda en el servidor";
  if (t < RESPONSE) return "3 · llega una request";
  if (t < r.end) return "4 · SSR arma su HTML en el servidor; CSR, en tu navegador";
  return LANES.map((lane) => `${lane.id} ${Math.round(laneTotal(r.model[lane.id]))} ms`).join(" · ");
}
