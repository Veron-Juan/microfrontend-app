import { useEffect, useRef, type RefObject } from "react";
import type { RenderMode } from "@mfe/contracts";
import { FIGURES } from "@mfe/figures/figures";
import { lineOnTop, translateAlong, type Projection } from "@mfe/figures/kit";
import { byId, type AppId } from "./registry.ts";
import { setFocus, store, useStore, type State } from "./store.ts";

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Busca una pieza de la figura por su data-part. Si falta, el SVG generado y este código se desalinearon.
function part(root: Element, name: string): SVGElement {
  const found = root.querySelector<SVGElement>(`[data-part="${name}"]`);
  if (!found) throw new Error(`La figura no tiene la pieza "${name}"`);
  return found;
}

interface LegendKey {
  render: RenderMode;
  label: string;
}

interface PlateProps {
  fig: string;
  title: string;
  hint: string;
  label: string;
  svg: string;
  keys: LegendKey[];
  caption: string;
  readoutRef: RefObject<HTMLSpanElement>;
  stageRef: RefObject<HTMLDivElement>;
  onClick?: () => void;
}

function Plate({ fig, title, hint, readoutRef, keys, caption, stageRef, svg, label, onClick }: PlateProps) {
  return (
    <figure className="iso-figure">
      <div className="iso-plate">
        <div className="iso-plate-corners" aria-hidden="true">
          <span className="iso-plate-corner" data-corner="fig">{fig}</span>
          <span className="iso-plate-corner" data-corner="title">{title}</span>
          <span className="iso-plate-corner" data-corner="hint">{hint}</span>
          <span className="iso-plate-corner" data-corner="readout" ref={readoutRef} />
        </div>
        <div className="iso-stage" ref={stageRef} tabIndex={0} aria-label={label} onClick={onClick} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      <figcaption className="iso-legend">
        <span className="iso-keys">
          {keys.map((key) => (
            <span className="iso-key" key={key.label}>
              <i className="key-dot" data-render={key.render} />
              {key.label}
            </span>
          ))}
        </span>
        <span className="iso-caption">{caption}</span>
      </figcaption>
    </figure>
  );
}

type Tick = (dt: number, stage: HTMLDivElement, readout: HTMLSpanElement) => void;

// Corre un bucle de animación solo mientras la figura está en pantalla.
function useLoop(stageRef: RefObject<HTMLDivElement>, readoutRef: RefObject<HTMLSpanElement>, tick: Tick) {
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    const stage = stageRef.current;
    const readout = readoutRef.current;
    if (!stage || !readout) return undefined;
    let frame = 0;
    let last = 0;
    let visible = false;
    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      tickRef.current(dt, stage, readout);
      frame = visible ? requestAnimationFrame(step) : 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        last = 0;
        frame = requestAnimationFrame(step);
      }
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [stageRef, readoutRef]);
}

const say = (readout: HTMLElement, text: string) => {
  if (readout.textContent !== text) readout.textContent = text;
};

// ── Fig 1: el rack ────────────────────────────────────────────────────────────────
interface ModuleMotion {
  at: number;
  fan: number;
  spin: number;
  count: number;
}

export function RackFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const { P, TRAVEL, SLOTS, FAN } = FIGURES.rack.data;
  const motion = useRef<Record<string, ModuleMotion>>(Object.fromEntries(SLOTS.map((slot) => [slot.id, { at: TRAVEL, fan: 0, spin: 0, count: 0 }])));

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

  useLoop(stage, readout, (dt, svg, out) => {
    const { loads, focus } = store.get();
    const still = calm();
    let plugged = 0;
    for (const slot of SLOTS) {
      const id = slot.id as AppId;
      const m = motion.current[id];
      const load = loads[id];
      const status = load?.status ?? "idle";
      if (status === "ready") plugged += 1;
      const target = status === "ready" ? 0 : status === "loading" ? TRAVEL * 0.5 : TRAVEL;
      m.at = still ? target : m.at + (target - m.at) * (1 - Math.exp(-dt / 0.22));
      part(svg, `mod-${id}`).setAttribute("transform", translateAlong(P, [0, m.at, 0]));
      const plug = Math.abs(m.at) < 0.6 && status === "ready";
      part(svg, `led-${id}`).dataset.on = String(plug);
      const body = part(svg, `body-${id}`).querySelector(".iso-solid");
      if (focus === id) body?.setAttribute("data-lit", "");
      else body?.removeAttribute("data-lit");
      const trace = part(svg, `trace-${id}`);
      trace.dataset.tone = plug ? (focus === id ? "lit" : "mid") : "faint";
      if (plug && !still) trace.setAttribute("data-flow", "");
      else trace.removeAttribute("data-flow");
      const fan = FAN[id];
      if (fan) {
        // El ventilador acelera en cada request nueva al servidor SSR.
        if ((load?.count ?? 0) !== m.count) {
          m.count = load?.count ?? 0;
          m.spin = 14;
        }
        m.spin += ((plug ? 1.2 : 0) - m.spin) * (1 - Math.exp(-dt / 0.9));
        m.fan += still ? 0 : m.spin * dt;
        part(svg, `fan-${id}`).setAttribute("d", fanBlades(P, fan[0], fan[1], fan[2], m.fan));
      }
    }
    let text = `${plugged}/${SLOTS.length} módulos enchufados`;
    if (focus && focus !== "shell") {
      const app = byId[focus];
      const load = loads[focus];
      text = `${app.name} · ${app.render} · ${load?.status === "ready" ? load.ms + " ms" : load?.status === "error" ? "caído" : "cargando"}`;
    }
    say(out, text);
  });

  return (
    <Plate
      fig="Fig 1"
      title="El shell y sus módulos"
      hint="Pasa el cursor por un módulo"
      readoutRef={readout}
      stageRef={stage}
      svg={FIGURES.rack.svg}
      label="El rack: el shell como chasis y un módulo por micro-frontend"
      keys={[
        { render: "SSR", label: "Ventilador: trabaja en cada request (SSR)" },
        { render: "CSR", label: "Chip: su código corre en el navegador (CSR)" },
        { render: "SSG", label: "Hojas impresas: se generó en el build (SSG)" },
      ]}
      caption="Cada módulo entra en su ranura en el momento en que su remote termina de cargar en esta misma página, y su LED se enciende con el color de su tipo de render. Si tiras un servidor desde el inspector, su módulo sale del chasis y los demás siguen enchufados."
    />
  );
}

function fanBlades(P: Projection, cx: number, cy: number, z: number, turn: number) {
  let d = "";
  for (let i = 0; i < 5; i++) {
    const a = turn + (i / 5) * Math.PI * 2;
    d += lineOnTop([cx + Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2], [cx + Math.cos(a + 0.5) * 7.6, cy + Math.sin(a + 0.5) * 7.6], z, P);
  }
  return d;
}

// ── Fig 2: tres carriles ──────────────────────────────────────────────────────────
const serverTiming = (header: string | undefined) =>
  (header ?? "").split(",").reduce((sum, part) => sum + Number(part.match(/dur=([\d.]+)/)?.[1] ?? 0), 0);

/** Cuánto tarda cada fase de un carril, en milisegundos medidos en esta página. */
export interface LaneModel {
  server: number;
  transfer: number;
  browser: number;
  ready: boolean;
}
export type RenderModel = Record<RenderMode, LaneModel>;

export function renderModel(loads: State["loads"]): RenderModel {
  const { news, guide, catalog } = loads;
  const ssrServer = Math.round(serverTiming(news?.headers?.["server-timing"]));
  return {
    SSG: { server: 0, transfer: guide?.ms ?? 0, browser: 0, ready: guide?.status === "ready" },
    SSR: { server: ssrServer, transfer: Math.max(1, (news?.ms ?? 0) - ssrServer), browser: 0, ready: news?.status === "ready" },
    CSR: { server: 0, transfer: catalog?.ms ?? 0, browser: catalog?.painted ?? 0, ready: catalog?.status === "ready" },
  };
}
const total = (lane: LaneModel) => lane.server + lane.transfer + lane.browser;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Run {
  t: number;
  model: RenderModel | null;
  scale: number;
  hold: number;
}

export function RenderFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const { P, LANES, START, END, PLUNGER_REST, PLUNGER_LOW } = FIGURES.render.data;
  const run = useRef<Run>({ t: 0, model: null, scale: 1, hold: 0 });
  const loads = useStore((s) => s.loads);
  const ready = (["news", "guide", "catalog"] as const).every((id) => loads[id]?.status === "ready");

  const restart = () => {
    const model = renderModel(store.get().loads);
    const longest = Math.max(...Object.values(model).map(total), 1);
    // Cámara lenta: el carril más lento tarda ~3,2 s en pantalla.
    run.current = { t: 0, model, scale: 3200 / longest, hold: 0 };
  };

  useEffect(() => {
    if (ready) restart();
  }, [ready]);

  useLoop(stage, readout, (dt, svg, out) => {
    const r = run.current;
    if (!r.model) {
      say(out, "esperando las primeras cargas…");
      return;
    }
    const still = calm();
    r.t += dt * 1000;
    let done = 0;
    const parts: string[] = [];
    for (const lane of LANES) {
      const m = r.model[lane.id];
      const t = still ? Infinity : r.t / r.scale; // tiempo "real" simulado, en ms
      const server = m.server;
      const arrive = server + m.transfer;
      const end = arrive + m.browser;
      const travel = Math.min(1, Math.max(0, (t - server) / Math.max(m.transfer, 0.001)));
      part(svg, `car-${lane.id}`).setAttribute("transform", translateAlong(P, [(END - START) * ease(travel), 0, 0]));
      if (lane.id === "SSR") {
        // La prensa baja y sube durante el tiempo de servidor.
        const press = server ? Math.min(1, Math.max(0, t / server)) : 1;
        const depth = Math.sin(Math.PI * press);
        part(svg, "plunger-SSR").setAttribute("transform", translateAlong(P, [0, 0, -(PLUNGER_REST - PLUNGER_LOW) * (t < server ? depth : 0)]));
        const printed = t >= server * 0.5;
        part(svg, "blank-SSR").dataset.on = String(!printed);
        part(svg, "page-SSR").dataset.on = String(printed);
      }
      if (lane.id === "CSR") part(svg, "blocks-CSR").dataset.on = String(t < arrive + m.browser * 0.5);
      const rows = part(svg, `paint-${lane.id}`).querySelectorAll<SVGElement>("[data-row]");
      rows.forEach((row, i) => {
        const on = lane.id === "CSR" ? t >= arrive + (m.browser * (i + 1)) / rows.length : t >= arrive;
        row.dataset.on = String(on);
      });
      part(svg, `led-${lane.id}`).dataset.on = String(t >= end);
      if (t >= end) done += 1;
      parts.push(`${lane.id} ${Math.round(end)} ms`);
    }
    say(out, parts.join(" · "));
    if (done === LANES.length && !still) {
      r.hold += dt;
      if (r.hold > 2.4) restart();
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
      label="Tres carriles: SSR, SSG y CSR"
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
