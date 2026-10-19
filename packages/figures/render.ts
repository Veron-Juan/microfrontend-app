// Fig 2 · Tres carriles, tres formas de renderizar. A la izquierda el servidor, a la derecha
// la pantalla del usuario. SSG: la página ya estaba impresa y apilada antes de la request.
// SSR: una prensa la imprime en el momento en que llega la request. CSR: viaja una caja de
// piezas sueltas y la página se arma en la pantalla. Los tiempos los mide el shell en vivo.
import * as k from "./kit/iso-kit.ts";

export type LaneId = "SSR" | "SSG" | "CSR";
export interface Lane {
  id: LaneId;
  y: number;
}

export const WIDTH = 640;
export const HEIGHT = 420;

const PLATE = { x: -150, y: -80, w: 250, d: 160, r: 9 };
const PLATE_H = 10;
const FOOT_H = 5;

export const LANES: Lane[] = [
  { id: "SSR", y: -50 },
  { id: "SSG", y: 0 },
  { id: "CSR", y: 50 },
];
const TONE: Record<LaneId, string> = { CSR: "blue", SSR: "amber", SSG: "green" };
const RAIL_H = 2.5;
const CAR = { w: 24, d: 22, h: 3.5 };
export const START = -88; // centro del carro en el servidor
export const END = 38; // centro del carro junto a la pantalla
const CAR_TOP = RAIL_H + CAR.h;
const PAGE_H = 1.2;
const PRESS = { x: -114, top: 50 };
export const PLUNGER_REST = 30; // base del pisón en reposo
export const PLUNGER_LOW = CAR_TOP + PAGE_H; // base del pisón al estampar
const SCREEN_X = 76; // cara visible de la pantalla

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PRESS.x, LANES[0].y - 16, PRESS.top + 6], [SCREEN_X, LANES[0].y - 18, 44], [SCREEN_X, LANES[2].y + 18, 44]],
  WIDTH,
  HEIGHT,
  { pad: 24, azimuth: 52 },
);

const at = (point: k.Point3) => k.iso(point, P);
const atAll = (points: k.Point3[]) => points.map(at);
const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
const D = (points: k.Flat[], style?: Parameters<typeof k.dotsSvg>[1]) => k.dotsSvg(points, style);
const faceRect = (x: number, y0: number, y1: number, z0: number, z1: number) => k.pathOf(atAll([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]]), true);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 22).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7.5, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.6, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -PLATE_H / 2, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Una línea grabada separa el lado servidor del lado navegador.
  out.push(L(k.lineOnTop([-64, PLATE.y + 5], [-64, PLATE.y + PLATE.d - 5], 0, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([56, PLATE.y + 5], [56, PLATE.y + PLATE.d - 5], 0, P), { tone: "faint" }));
  return out.join("");
}

function track(lane: Lane) {
  const out: string[] = [];
  const { y } = lane;
  for (const dy of [-CAR.d / 2 + 2, CAR.d / 2 - 4.4]) {
    const rail = { x: START - 14, y: y + dy, w: END - START + 28, d: 2.4, r: 0.6 };
    out.push(S(k.slabOf(rail, 0, RAIL_H, P, 2, 0.3), { tone: "mid", crease: "lo" }));
    out.push(D([at([rail.x + 2.5, rail.y + 1.2, RAIL_H]), at([rail.x + rail.w - 2.5, rail.y + 1.2, RAIL_H])], { size: 0.4, tone: "lo" }));
  }
  // Regla del carril: el camino que recorre la página por la red.
  const strip = { x: START - 10, y: y + CAR.d / 2 + 3, w: END - START + 20, d: 5, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.5, 0.6, [1.5, 3], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

function pageLines(x: number, y: number, z: number, printed: boolean) {
  const out: string[] = [];
  out.push(S(k.slabOf({ x: x - 9, y: y - 8, w: 18, d: 16, r: 0.8 }, z, PAGE_H, P, 2, 0.2), { tone: "hi", crease: "lo" }));
  if (printed) {
    const top = z + PAGE_H;
    const rows = [[-6, 7], [-3, 4], [0, 6], [3, 2]];
    out.push(L(rows.map(([dx, len]) => k.lineOnTop([x + dx, y - 5], [x + dx, y - 5 + len + 3], top, P)).join(""), { tone: "lo", free: true }));
  }
  return out.join("");
}

function carriage(lane: Lane) {
  const { y } = lane;
  const cx = START;
  const plan = { x: cx - CAR.w / 2, y: y - CAR.d / 2, w: CAR.w, d: CAR.d, r: 1.6 };
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), RAIL_H, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(plan, RAIL_H, CAR.h, P, 3, 0.5), { tone: "mid", crease: "lo" }));
  out.push(D(k.corners(plan, 2.2).map(([px, py]) => at([px, py, CAR_TOP])), { size: 0.4, tone: "lo" }));
  // Perilla de empuje en la cola del carro.
  out.push(S(k.slabOf({ x: plan.x - 3, y: y - 1.5, w: 3, d: 3, r: 0.6 }, RAIL_H + 0.6, 2.2, P, 2), { tone: "mid", crease: "none" }));
  if (lane.id === "SSG") out.push(`<g data-part="page-SSG">${pageLines(cx, y, CAR_TOP, true)}</g>`);
  if (lane.id === "SSR") {
    out.push(`<g data-part="blank-SSR" data-on="true">${pageLines(cx, y, CAR_TOP, false)}</g>`);
    out.push(`<g data-part="page-SSR" data-on="false">${pageLines(cx, y, CAR_TOP, true)}</g>`);
  }
  if (lane.id === "CSR") {
    // Piezas sueltas: el bundle de JavaScript que el navegador va a ejecutar.
    const blocks = [[-6, -5, 4], [0, -5, 3], [6, -5, 5], [-6, 2, 3], [0, 2, 5], [6, 2, 2.5]];
    out.push(`<g data-part="blocks-CSR" data-on="true">${blocks
      .map(([dx, dy, h]) => S(k.slabOf({ x: cx + dx - 2.4, y: y + dy - 2.4, w: 4.8, d: 4.8, r: 0.5 }, CAR_TOP, h, P, 2, 0.2), { tone: "hi", crease: "lo" }))
      .join("")}</g>`);
  }
  return out.join("");
}

// Lo que está detrás del carro (se pinta antes) y lo que queda delante (después).
function machine(lane: Lane) {
  const { y } = lane;
  const back: string[] = [];
  const front: string[] = [];
  if (lane.id === "SSG") {
    // El "CDN": un cargador con copias idénticas ya impresas.
    const box = { x: -134, y: y - 13, w: 26, d: 26, r: 2 };
    back.push(`<path class="iso-halo" d="${k.haloOf(box, 0, 6, P)}" style="filter:blur(5px)"/>`);
    back.push(S(k.slabOf(box, 0, 6, P, 3, 0.6), { tone: "mid", crease: "lo" }));
    back.push(D(k.corners(box, 2.4).map(([px, py]) => at([px, py, 6])), { size: 0.45 }));
    const posts = k.corners(box, 3.2).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
    posts.slice(0, 3).forEach(([px, py]) => back.push(S(k.cylinder(px, py, 1.4, 6, 20, P, 14), { tone: "mid", crease: "none" })));
    for (let i = 0; i < 6; i++) back.push(pageLines(-121, y, 6 + i * (PAGE_H + 0.3), i === 5));
    posts.slice(3).forEach(([px, py]) => front.push(S(k.cylinder(px, py, 1.4, 6, 20, P, 14), { tone: "mid", crease: "none" })));
  } else if (lane.id === "SSR") {
    // La prensa: imprime la página en el momento de la request.
    const foot = { x: PRESS.x - 12, y: y - 18, w: 24, d: 36, r: 2 };
    back.push(`<path class="iso-halo" d="${k.haloOf(foot, 0, 4, P)}" style="filter:blur(5px)"/>`);
    back.push(S(k.slabOf({ x: PRESS.x - 8, y: y - 18, w: 16, d: 5, r: 1 }, 0, 4, P, 2, 0.4), { tone: "mid" }));
    back.push(S(k.cylinder(PRESS.x, y - 15.5, 2, 4, PRESS.top - 4, P, 18), { tone: "mid", crease: "none" }));
    front.push(`<g data-part="plunger-SSR" transform="${k.translateAlong(P, [0, 0, 0])}">${[
      S(k.cylinder(PRESS.x + 26, y, 2.4, PLUNGER_REST + 3, PRESS.top - PLUNGER_REST - 3, P, 18), { tone: "mid", crease: "none" }),
      S(k.slabOf({ x: PRESS.x + 26 - 10, y: y - 9, w: 20, d: 18, r: 1.2 }, PLUNGER_REST, 3, P, 3, 0.5), { tone: "hi", crease: "lo" }),
    ].join("")}</g>`);
    front.push(S(k.slabOf({ x: PRESS.x - 8, y: y + 13, w: 16, d: 5, r: 1 }, 0, 4, P, 2, 0.4), { tone: "mid" }));
    front.push(S(k.cylinder(PRESS.x, y + 15.5, 2, 4, PRESS.top - 4, P, 18), { tone: "mid", crease: "none" }));
    const beam = { x: PRESS.x - 4, y: y - 19, w: 34, d: 38, r: 2 };
    front.push(S(k.slabOf(beam, PRESS.top, 6, P, 3, 0.6), { tone: "mid", crease: "lo", inner: L(k.sideSeam(beam, PRESS.top + 3, P, 3), { tone: "faint" }) }));
    front.push(D(k.corners(beam, 3).map(([px, py]) => at([px, py, PRESS.top + 6])), { size: 0.45 }));
    front.push(S(k.cylinder(PRESS.x + 26, y, 4, PRESS.top + 6, 2.4, P, 24), { tone: "mid" }));
    front.push(L(k.knurl(PRESS.x + 26, y, 4, PRESS.top + 6, PRESS.top + 8.4, 22, P), { tone: "lo" }));
  } else {
    // La caja de piezas: el servidor solo entrega archivos estáticos de JavaScript.
    const crate = { x: -134, y: y - 13, w: 26, d: 26, r: 1.5 };
    back.push(`<path class="iso-halo" d="${k.haloOf(crate, 0, 12, P)}" style="filter:blur(5px)"/>`);
    back.push(S(k.slabOf(crate, 0, 12, P, 2, 0.5), { tone: "mid", crease: "lo", inner: [3, 6, 9].map((z) => L(k.sideSeam(crate, z, P, 2), { tone: "faint" })).join("") }));
    back.push(L(k.planOutline(k.insetPlan(crate, 2), 12, P, 2), { tone: "lo" }));
    const spare = [[-127, y - 6], [-121, y - 6], [-115, y - 6], [-127, y + 1], [-121, y + 1], [-115, y + 1]];
    spare.forEach(([px, py], i) => back.push(S(k.slabOf({ x: px - 2.4, y: py - 2.4, w: 4.8, d: 4.8, r: 0.5 }, 12, 2 + (i % 3), P, 2, 0.2), { tone: "hi", crease: "lo" })));
  }
  return { back: back.join(""), front: front.join("") };
}

function screen(lane: Lane) {
  const { y } = lane;
  const out: string[] = [];
  const foot = { x: SCREEN_X - 10, y: y - 11, w: 18, d: 22, r: 2 };
  out.push(`<path class="iso-halo" d="${k.haloOf(foot, 0, 3, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(foot, 0, 2.5, P, 3, 0.5), { tone: "mid", crease: "lo" }));
  out.push(S(k.slabOf({ x: SCREEN_X - 6, y: y - 2.5, w: 4, d: 5, r: 0.8 }, 2.5, 10, P, 2), { tone: "mid", crease: "none" }));
  const body = { x: SCREEN_X - 6, y: y - 18, w: 6, d: 36, r: 1.4 };
  out.push(S(k.slabOf(body, 12.5, 30, P, 3, 0.4), { tone: "mid", crease: "lo" }));
  // Marco del vidrio y el contenido pintado: se enciende cuando la página está en pantalla.
  out.push(L(faceRect(SCREEN_X, y - 15.5, y + 15.5, 15, 40), { tone: "lo" }));
  const rows = [
    faceRect(SCREEN_X, y - 13, y + 13, 34, 38),
    k.segment([SCREEN_X, y - 13, 30], [SCREEN_X, y + 9, 30], P),
    k.segment([SCREEN_X, y - 13, 26.5], [SCREEN_X, y + 4, 26.5], P),
    faceRect(SCREEN_X, y - 13, y - 1, 17, 23.5),
    faceRect(SCREEN_X, y + 1, y + 13, 17, 23.5),
  ];
  out.push(`<g data-part="paint-${lane.id}">${rows.map((d, i) => `<path class="iso-line" data-row="${i}" data-on="false" data-tone="${TONE[lane.id]}" d="${d}" style="stroke-width:1"/>`).join("")}</g>`);
  out.push(D([at([SCREEN_X, y + 13, 13.8])], { size: 0.6, tone: "lo" }));
  out.push(`<g data-part="led-${lane.id}" data-on="false">${D([at([SCREEN_X, y - 13, 13.8])], { size: 0.9, tone: "hi" })}</g>`);
  return out.join("");
}

export function build() {
  const body = [base()];
  for (const lane of LANES) {
    const m = machine(lane);
    body.push(
      track(lane),
      m.back,
      `<g data-part="car-${lane.id}" transform="${k.translateAlong(P, [0, 0, 0])}">${carriage(lane)}</g>`,
      m.front,
      screen(lane),
    );
  }
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    className: "fig-render",
    label:
      "Tres carriles paralelos sobre una base. A la izquierda, el lado servidor: un cargador con páginas ya impresas (SSG), una prensa que imprime una página en el momento (SSR) y una caja de piezas sueltas (CSR). Un carro lleva cada entrega por su carril hasta una pantalla a la derecha. La pantalla de SSG y SSR se pinta al llegar; la de CSR se pinta después, cuando las piezas se arman en el navegador.",
    body,
  });
  return { svg, data: { P, LANES, START, END, PLUNGER_REST, PLUNGER_LOW } };
}
