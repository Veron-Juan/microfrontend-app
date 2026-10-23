import { useEffect, useRef, useState } from "react";
import { FIGURES } from "@mfe/figures/figures";
import { store, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { part, prefersReducedMotion, say } from "./dom.ts";
import { Plate } from "./Plate.tsx";
import { easeInOutCubic, laneTotal, renderModel, type RenderModel } from "./render-model.ts";
import { useAnimationLoop } from "./use-animation-loop.ts";

const { LANES, COLUMNS, LOOSE, TIGHT } = FIGURES.render.data;

type Flat = (typeof LOOSE)[number];

/** The sequence, in seconds. The build and the request are the same for all; the response uses the measured timings. */
const APPEAR: [number, number] = [0.2, 0.7];
const SSG_BUILD: [number, number] = [0.9, 2.1];
const DEPLOY: [number, number] = [2.4, 3.2];
const REQUEST: [number, number] = [3.5, 4.2];
const RESPONSE = 4.3;
/** Each response phase lasts at least MIN_PHASE and at most MIN_PHASE + SPREAD, based on what was measured. */
const MIN_PHASE = 0.45;
const SPREAD = 1.6;
/** Building the page is always visible, even if it takes only a few milliseconds in the browser. */
const MIN_ASSEMBLY = 0.9;
const HOLD = 3.4;
const FADE = 0.6;

interface Timeline {
  /** When the page starts and finishes being built in each row. */
  assemble: [number, number];
  /** When it travels from the server to the browser. */
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
      // SSG: the page was already made. It leaves the server as soon as the request arrives.
      const travel: [number, number] = [RESPONSE, RESPONSE + span(m.transfer)];
      lanes[lane.id] = { assemble: SSG_BUILD, travel, end: travel[1] };
    } else if (lane.builds === "server") {
      // SSR: the server builds it when the request arrives and then sends it.
      const assemble: [number, number] = [RESPONSE, RESPONSE + Math.max(span(m.server), MIN_ASSEMBLY)];
      const travel: [number, number] = [assemble[1], assemble[1] + span(m.transfer)];
      lanes[lane.id] = { assemble, travel, end: travel[1] };
    } else {
      // CSR: the loose pieces travel and the page is built in the browser.
      const travel: [number, number] = [RESPONSE, RESPONSE + span(m.transfer)];
      const assemble: [number, number] = [travel[1], travel[1] + Math.max(span(m.browser), MIN_ASSEMBLY)];
      lanes[lane.id] = { assemble, travel, end: assemble[1] };
    }
  }
  return { t: 0, model, lanes, end: Math.max(...Object.values(lanes).map((lane) => lane.end)) };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const progress = (t: number, [from, to]: [number, number]) => clamp((t - from) / Math.max(to - from, 0.001));
const mix = (a: Flat, b: Flat, f: number): Flat => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const translate = ([x, y]: Flat) => `translate(${x.toFixed(2)} ${y.toFixed(2)})`;

// Fig 2: where and when the HTML is built in SSG, SSR and CSR, with the timings measured on this page.
export function RenderFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const run = useRef<Run>(startRun());
  const [paused, setPaused] = useState(false);
  const ready = useStore((s) => (["news", "guide", "catalog"] as const).every((id) => s.loads[id]?.status === "ready"));
  const restart = () => {
    run.current = startRun();
    setPaused(false);
  };

  useEffect(() => {
    if (ready) run.current = startRun();
  }, [ready]);

  useAnimationLoop(stage, readout, (dt, svg, out) => {
    const r = run.current;
    const still = prefersReducedMotion();
    if (!paused) r.t += dt;
    const t = still ? Infinity : r.t;
    const fade = still ? 1 : 1 - clamp((t - r.end - HOLD) / FADE);
    const shown = still ? 1 : progress(t, APPEAR);

    for (const lane of LANES) {
      const plan = r.lanes[lane.id];
      if (!plan) continue;
      // Where it is: at build time, on the server after the deploy and in the browser after the trip.
      const deploy = easeInOutCubic(progress(t, DEPLOY));
      const travel = easeInOutCubic(progress(t, plan.travel));
      const x = (COLUMNS.server - COLUMNS.build) * deploy + (COLUMNS.browser - COLUMNS.server) * travel;
      const content = part(svg, `content-${lane.id}`);
      content.setAttribute("transform", translate([x, 0]));
      content.style.opacity = String(shown * fade);

      // Assembling: the pieces come together in a grid and the grid turns into a page.
      const span = plan.assemble[1] - plan.assemble[0];
      const join = easeInOutCubic(progress(t, [plan.assemble[0], plan.assemble[0] + span * 0.6]));
      const become = progress(t, [plan.assemble[0] + span * 0.6, plan.assemble[1]]);
      LOOSE.forEach((loose, i) => {
        part(svg, `cube-${lane.id}-${i}`).setAttribute("transform", translate(mix(loose, TIGHT[i] ?? loose, join)));
      });
      part(svg, `cubes-${lane.id}`).style.opacity = String(1 - become);
      part(svg, `page-${lane.id}`).style.opacity = String(become);
      part(svg, `cell-${lane.id}`).dataset.on = String(become > 0.5 && fade > 0);
      const done = t >= plan.end && fade > 0;
      part(svg, `screen-${lane.id}`).dataset.on = String(done);
      // How long it took, next to the row's name, once the page is on your screen.
      say(part(svg, `ms-${lane.id}`), done ? `${Math.round(laneTotal(r.model[lane.id]))} ms` : "");

      // The request: a dot traveling from the browser to the server. SSG doesn't wait for it to build.
      const request = progress(t, REQUEST);
      const dot = part(svg, `req-${lane.id}`);
      dot.setAttribute("transform", translate([(COLUMNS.server - COLUMNS.browser) * easeInOutCubic(request), 0]));
      dot.dataset.on = String(request > 0 && request < 1);
    }

    say(out, readoutText(t, r));
    if (!still && fade === 0) run.current = startRun();
  });

  return (
    <Plate
      fig="Fig 2"
      title="Where and when the HTML is built"
      hint="Timings measured on this page"
      readoutRef={readout}
      stageRef={stage}
      svg={FIGURES.render.svg}
      label="Rendering board: columns build, server and browser; rows SSG, SSR and CSR."
      controls={
        <>
          <Button variant="mini" onClick={() => setPaused(!paused)}>
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button variant="mini" onClick={restart}>
            Replay
          </Button>
        </>
      }
      keys={[
        { render: "SSG", label: "SSG: built at build time, before any request" },
        { render: "SSR", label: "SSR: built on the server, on every request" },
        { render: "CSR", label: "CSR: the pieces travel and it's built in your browser" },
      ]}
      caption="Columns: where and when. Rows: the three kinds of rendering. Each row carries loose pieces (components and data) that come together into a page in a single cell, the one that lights up. First the build, then the deploy and finally the request, with the timings measured on this page when loading the Guide (SSG), News (SSR) and the Catalog (CSR). For CSR the time runs until the catalog mounts: it fetches its TVmaze data afterwards, already in the browser. Request a remote again from the inspector and the figure uses the new numbers."
    />
  );
}

function readoutText(t: number, r: Run) {
  if (t < SSG_BUILD[0]) return "1 · build: there are no requests yet";
  if (t < DEPLOY[0]) return "1 · build: SSG builds its HTML now, just once";
  if (t < REQUEST[0]) return "2 · deploy: everything sits on the server";
  if (t < RESPONSE) return "3 · a request arrives";
  if (t < r.end) return "4 · SSR builds its HTML on the server; CSR, in your browser";
  return LANES.map((lane) => `${lane.id} ${Math.round(laneTotal(r.model[lane.id]))} ms`).join(" · ");
}
