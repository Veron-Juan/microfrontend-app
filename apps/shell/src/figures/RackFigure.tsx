import { useEffect, useRef } from "react";
import { FIGURES } from "@mfe/figures/figures";
import { lineOnTop, translateAlong, type Projection } from "@mfe/figures/kit";
import { byId, type AppId } from "../mfe/registry.ts";
import { setFocus, store } from "../state/store.ts";
import { part, prefersReducedMotion, say } from "./dom.ts";
import { Plate } from "./Plate.tsx";
import { useAnimationLoop } from "./use-animation-loop.ts";

const { P, TRAVEL, SLOTS, FAN } = FIGURES.rack.data;

/** Tiempos de las animaciones, en segundos (constante de la curva exponencial). */
const SLIDE_TIME = 0.22;
const FAN_SPIN_DOWN = 0.9;
const FAN_BURST = 14;
const FAN_IDLE = 1.2;

interface ModuleMotion {
  /** Cuánto le falta al módulo para estar enchufado (0 = enchufado). */
  at: number;
  fan: number;
  spin: number;
  /** Requests vistas, para acelerar el ventilador con cada una nueva. */
  count: number;
}

// Fig 1: el shell como chasis y un módulo por remote, que se enchufa cuando su carga termina.
export function RackFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const motion = useRef<Record<string, ModuleMotion>>(
    Object.fromEntries(SLOTS.map((slot) => [slot.id, { at: TRAVEL, fan: 0, spin: 0, count: 0 }])),
  );

  // Pasar el cursor por un módulo resalta su remote en toda la página.
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
    let plugged = 0;
    for (const slot of SLOTS) {
      const id = slot.id as AppId;
      const m = motion.current[id];
      if (!m) continue;
      const load = loads[id];
      const status = load?.status ?? "idle";
      if (status === "ready") plugged += 1;

      const target = status === "ready" ? 0 : status === "loading" ? TRAVEL * 0.5 : TRAVEL;
      m.at = still ? target : m.at + (target - m.at) * (1 - Math.exp(-dt / SLIDE_TIME));
      part(svg, `mod-${id}`).setAttribute("transform", translateAlong(P, [0, m.at, 0]));

      const plug = Math.abs(m.at) < 0.6 && status === "ready";
      part(svg, `led-${id}`).dataset.on = String(plug);
      part(svg, `body-${id}`)
        .querySelector(".iso-solid")
        ?.toggleAttribute("data-lit", focus === id);
      const trace = part(svg, `trace-${id}`);
      trace.dataset.tone = plug ? (focus === id ? "lit" : "mid") : "faint";
      trace.toggleAttribute("data-flow", plug && !still);

      const fan = FAN[id];
      if (fan) {
        // El ventilador acelera en cada request nueva al servidor SSR.
        if ((load?.count ?? 0) !== m.count) {
          m.count = load?.count ?? 0;
          m.spin = FAN_BURST;
        }
        m.spin += ((plug ? FAN_IDLE : 0) - m.spin) * (1 - Math.exp(-dt / FAN_SPIN_DOWN));
        m.fan += still ? 0 : m.spin * dt;
        part(svg, `fan-${id}`).setAttribute("d", fanBlades(P, fan[0], fan[1], fan[2], m.fan));
      }
    }
    say(out, readoutText(plugged));
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

function readoutText(plugged: number) {
  const { loads, focus } = store.get();
  if (!focus || focus === "shell") return `${plugged}/${SLOTS.length} módulos enchufados`;
  const app = byId[focus];
  const load = loads[focus];
  const state = load?.status === "ready" ? `${load.ms} ms` : load?.status === "error" ? "caído" : "cargando";
  return `${app.name} · ${app.render} · ${state}`;
}

function fanBlades(projection: Projection, cx: number, cy: number, z: number, turn: number) {
  let d = "";
  for (let i = 0; i < 5; i++) {
    const a = turn + (i / 5) * Math.PI * 2;
    const from: [number, number] = [cx + Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2];
    const to: [number, number] = [cx + Math.cos(a + 0.5) * 7.6, cy + Math.sin(a + 0.5) * 7.6];
    d += lineOnTop(from, to, z, projection);
  }
  return d;
}
