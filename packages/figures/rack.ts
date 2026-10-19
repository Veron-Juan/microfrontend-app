// Fig 1 · El rack. El shell es un chasis con un backplane (el bus del navegador) y cada
// micro-frontend es un módulo que se enchufa en su ranura. Un módulo entra cuando su remote
// termina de cargar, su LED se enciende con el color de su tipo de render, y sale si su
// servidor cae. Lo que mueve el dibujo es el estado real de carga del shell.
import * as k from "./kit/iso-kit.ts";

export type Render = "CSR" | "SSR" | "SSG";
export interface Slot {
  id: string;
  x: number;
  render: Render;
}

export const WIDTH = 640;
export const HEIGHT = 400;

const PLATE = { x: -134, y: -74, w: 268, d: 146, r: 9 };
const PLATE_H = 10;
const FOOT_H = 5;

const BACK = { x: -114, y: -60, w: 228, d: 14, r: 1.6 };
const BACK_H = 80;
const FACE_Y = BACK.y + BACK.d; // cara frontal del backplane
const SOCKET_D = 4;
const MOD_Y = FACE_Y + SOCKET_D; // espalda del módulo enchufado
const MOD = { w: 26, d: 66, h: 56 };
const RAIL_H = 3;
const MOD_Z = RAIL_H;
const MOD_TOP = MOD_Z + MOD.h;
export const TRAVEL = 36; // cuánto sale un módulo desenchufado (unidades de mundo)

// Ranuras de izquierda a derecha, en el mismo orden en que aparecen en la página.
export const SLOTS: Slot[] = [
  { id: "news", x: -78, render: "SSR" },
  { id: "catalog", x: -26, render: "CSR" },
  { id: "player", x: 26, render: "CSR" },
  { id: "guide", x: 78, render: "SSG" },
];
const TONE: Record<Render, string> = { CSR: "blue", SSR: "amber", SSG: "green" };

export const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners({ x: -118, y: -64, w: 236, d: 22, r: 3 }, 0, BACK_H + 7),
    [SLOTS[0].x - MOD.w / 2, MOD_Y + MOD.d + TRAVEL, MOD_TOP],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 58 },
);

const at = (point: k.Point3) => k.iso(point, P);
const atAll = (points: k.Point3[]) => points.map(at);
const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
const D = (points: k.Flat[], style?: Parameters<typeof k.dotsSvg>[1]) => k.dotsSvg(points, style);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 22).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 7.5, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.6, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(
    S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), {
      tone: "mid",
      inner: L(k.sideSeam(PLATE, -PLATE_H / 2, P, 8), { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(
    D(
      screws.map(([x, y]) => at([x, y, 0])),
      { size: 0.5 },
    ),
  );

  // Regla al frente: el "ancho de página" que se reparten los módulos.
  const strip = { x: -112, y: PLATE.y + PLATE.d - 13, w: 196, d: 6.5, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.2, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.2, 0.6])], { size: 0.45 }));

  // Placa de identificación con tres líneas de texto grabado.
  const label = { x: 98, y: 20, w: 28, d: 38, r: 1.6 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3, 0.3), { tone: "lo", crease: "none" }));
  out.push(
    L(
      [0, 1, 2]
        .map((row) =>
          k.lineOnTop(
            [label.x + 5 + row * 6, label.y + 6],
            [label.x + 5 + row * 6, label.y + label.d - 6 - row * 7],
            0.8,
            P,
          ),
        )
        .join(""),
      { tone: "faint", free: true },
    ),
  );
  out.push(
    D(
      k.corners(label, 2.6).map(([x, y]) => at([x, y, 0.8])),
      { size: 0.4 },
    ),
  );
  return out.join("");
}

function rails() {
  const out: string[] = [];
  for (const slot of SLOTS) {
    for (const dx of [-MOD.w / 2 + 1.5, MOD.w / 2 - 3.5]) {
      const rail = { x: slot.x + dx, y: MOD_Y, w: 2, d: MOD.d + TRAVEL - 2, r: 0.6 };
      out.push(S(k.slabOf(rail, 0, RAIL_H, P, 2, 0.3), { tone: "mid", crease: "lo" }));
      out.push(
        D([at([rail.x + 1, rail.y + rail.d - 3, RAIL_H]), at([rail.x + 1, rail.y + 30, RAIL_H])], {
          size: 0.38,
          tone: "lo",
        }),
      );
    }
    // Ranura grabada en la base entre los rieles.
    out.push(
      L(k.planOutline({ x: slot.x - 6, y: MOD_Y + 6, w: 12, d: MOD.d + TRAVEL - 14, r: 1.5 }, 0, P, 3), {
        tone: "faint",
      }),
    );
  }
  return out.join("");
}

function backplane() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BACK, 0, BACK_H, P)}" style="filter:blur(6px)"/>`];
  out.push(
    S(k.slabOf(BACK, 0, BACK_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(BACK, 10, P, 3), { tone: "faint" }) }),
  );
  // El bus: una pista horizontal sobre la cara frontal que une todas las ranuras.
  const BUS_Z = 64;
  out.push(L(k.segment([BACK.x + 6, FACE_Y, BUS_Z], [BACK.x + BACK.w - 6, FACE_Y, BUS_Z], P), { tone: "lo" }));
  out.push(
    L(k.segment([BACK.x + 6, FACE_Y, BUS_Z + 3], [BACK.x + BACK.w - 6, FACE_Y, BUS_Z + 3], P), { tone: "faint" }),
  );
  out.push(
    D(
      [
        at([BACK.x + 6, FACE_Y, BUS_Z]),
        at([BACK.x + BACK.w - 6, FACE_Y, BUS_Z]),
        at([BACK.x + 6, FACE_Y, BUS_Z + 3]),
        at([BACK.x + BACK.w - 6, FACE_Y, BUS_Z + 3]),
      ],
      { size: 0.5, tone: "mid" },
    ),
  );
  for (const slot of SLOTS) {
    const socket = { x: slot.x - 9, y: FACE_Y, w: 18, d: SOCKET_D, r: 1 };
    out.push(S(k.slabOf(socket, 14, 36, P, 2, 0.3), { tone: "lo", crease: "faint" }));
    // Pines del conector en la cara frontal del zócalo.
    const pins = [];
    for (let px = -6; px <= 6; px += 3)
      for (let pz = 19; pz <= 45; pz += 4) pins.push(at([slot.x + px, FACE_Y + SOCKET_D, pz]));
    out.push(D(pins, { size: 0.42, tone: "mid" }));
    // Pista de la ranura al bus: por aquí viajan los eventos.
    out.push(
      `<path class="iso-line" data-part="trace-${slot.id}" data-tone="faint" d="${k.segment([slot.x, FACE_Y, 50], [slot.x, FACE_Y, BUS_Z], P)}"/>`,
    );
    out.push(D([at([slot.x, FACE_Y, 50]), at([slot.x, FACE_Y, BUS_Z])], { size: 0.55, tone: "mid" }));
  }
  // Riel superior del chasis con su placa grabada: el shell.
  const cap = { x: -118, y: -64, w: 236, d: 22, r: 3 };
  out.push(
    S(k.slabOf(cap, BACK_H, 7, P, 6, 1.2), {
      tone: "hi",
      crease: "lo",
      inner: L(k.sideSeam(cap, BACK_H + 3.5, P, 6), { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(cap, 4), BACK_H + 7, P, 6), { tone: "faint" }));
  const plate = { x: -30, y: -58, w: 60, d: 10, r: 1 };
  out.push(S(k.slabOf(plate, BACK_H + 7, 0.6, P, 3), { tone: "lo", crease: "none" }));
  out.push(
    k.faceTextSvg(k.topMatrix([0, -51.6], BACK_H + 7.6, P, "x"), "SHELL · HOST", {
      size: 3.6,
      tone: "mid",
      anchor: "middle",
    }),
  );
  out.push(
    D(
      k.corners(cap, 5).map(([x, y]) => at([x, y, BACK_H + 7])),
      { size: 0.5 },
    ),
  );
  out.push(
    L(
      k
        .corners(cap, 5)
        .map(([x, y]) => k.ring(x, y, 2, BACK_H + 7, P, 14))
        .join(""),
      { tone: "lo" },
    ),
  );
  // Rejilla de ventilación sobre el riel.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const vx = side * 44 + (side < 0 ? -i * 7 : i * 7) - 2;
      out.push(L(k.planOutline({ x: vx, y: -58, w: 3.2, d: 10, r: 1.4 }, BACK_H + 7, P, 3), { tone: "lo" }));
    }
  }
  return out.join("");
}

// Hardware que distingue a cada tipo de módulo, sobre su cara superior.
function hardware(slot: Slot, plan: k.Plan) {
  const out: string[] = [];
  const top = MOD_TOP;
  const cx = slot.x;
  if (slot.render === "CSR") {
    // Un chip: el código viaja con el módulo y se ejecuta dentro del chasis (el navegador).
    const chip = { x: cx - 7.5, y: plan.y + 14, w: 15, d: 15, r: 1 };
    out.push(S(k.slabOf(chip, top, 2.4, P, 2, 0.4), { tone: "hi", crease: "lo" }));
    out.push(L(k.planOutline(k.insetPlan(chip, 2.4), top + 2.4, P, 2), { tone: "faint" }));
    const legs = [];
    for (let i = 0; i < 5; i++) {
      const o = 2.5 + i * 2.5;
      legs.push(k.lineOnTop([chip.x + o, chip.y + chip.d], [chip.x + o, chip.y + chip.d + 2.4], top, P));
      legs.push(k.lineOnTop([chip.x + chip.w, chip.y + o], [chip.x + chip.w + 2.4, chip.y + o], top, P));
    }
    out.push(L(legs.join(""), { tone: "mid", free: "end" }));
    out.push(D([at([chip.x + 3, chip.y + 3, top + 2.4])], { size: 0.7, tone: "lo" }));
  } else if (slot.render === "SSR") {
    // Un ventilador: este módulo trabaja en cada request, en el servidor.
    const fy = plan.y + 22;
    out.push(S(k.cylinder(cx, fy, 9.5, top, 2.6, P, 48, 0.5), { tone: "mid" }));
    out.push(L(k.ring(cx, fy, 8, top + 2.6, P, 48), { tone: "lo" }));
    out.push(
      `<path class="iso-line" data-part="fan-${slot.id}" data-tone="hi" d="${fanBlades(cx, fy, top + 2.6, 0)}"/>`,
    );
    out.push(S(k.cylinder(cx, fy, 1.8, top + 2.6, 0.8, P, 16), { tone: "hi" }));
    out.push(
      D(
        k.corners({ x: cx - 9.5, y: fy - 9.5, w: 19, d: 19, r: 0 }, 0.6).map(([x, y]) => at([x, y, top])),
        { size: 0.4, tone: "lo" },
      ),
    );
  } else {
    // Una pila de hojas ya impresas: este módulo se generó antes, en el build.
    for (let i = 0; i < 4; i++) {
      const sheet = { x: cx - 8.5 + i * 0.25, y: plan.y + 10 + i * 0.4, w: 17, d: 24, r: 0.8 };
      out.push(S(k.slabOf(sheet, top + i * 1.3, 1.3, P, 2, 0.2), { tone: "hi", crease: "lo" }));
    }
    const z = top + 5.2;
    const sheet = { x: cx - 7.75, y: plan.y + 11.2, w: 17, d: 24 };
    out.push(
      L(
        [0, 1, 2, 3]
          .map((row) =>
            k.lineOnTop(
              [sheet.x + 3 + row * 3.2, sheet.y + 4],
              [sheet.x + 3 + row * 3.2, sheet.y + sheet.d - 4 - (row % 2) * 6],
              z,
              P,
            ),
          )
          .join(""),
        { tone: "faint", free: true },
      ),
    );
  }
  return out.join("");
}

export function fanBlades(cx: number, cy: number, z: number, turn: number) {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = turn + (i / 5) * Math.PI * 2;
    out.push(
      k.lineOnTop(
        [cx + Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2],
        [cx + Math.cos(a + 0.5) * 7.6, cy + Math.sin(a + 0.5) * 7.6],
        z,
        P,
      ),
    );
  }
  return out.join("");
}
export const FAN: Record<string, k.Point3> = Object.fromEntries(
  SLOTS.filter((slot) => slot.render === "SSR").map((slot) => [
    slot.id,
    [slot.x, MOD_Y + 22, MOD_TOP + 2.6] as k.Point3,
  ]),
);

function module(slot: Slot) {
  const plan = { x: slot.x - MOD.w / 2, y: MOD_Y, w: MOD.w, d: MOD.d, r: 2 };
  const out = [
    `<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), MOD_Z, 0.1, P)}" style="filter:blur(5px)"/>`,
  ];
  out.push(
    `<g data-part="body-${slot.id}">${S(k.slabOf(plan, MOD_Z, MOD.h, P, 3, 0.8), { tone: "mid", crease: "lo", inner: L(k.sideSeam(plan, MOD_Z + 12, P, 3), { tone: "faint" }) + L(k.sideSeam(plan, MOD_TOP - 6, P, 3), { tone: "faint" }) })}</g>`,
  );
  out.push(L(k.planOutline(k.insetPlan(plan, 3), MOD_TOP, P, 3), { tone: "faint" }));
  const screws = k.corners(plan, 3.2);
  out.push(
    D(
      screws.map(([x, y]) => at([x, y, MOD_TOP])),
      { size: 0.45 },
    ),
  );
  // Rejillas cerradas cerca de la espalda.
  for (let i = 0; i < 3; i++)
    out.push(
      L(k.planOutline({ x: slot.x - 8, y: plan.y + 44 + i * 4, w: 16, d: 1.8, r: 0.9 }, MOD_TOP, P, 3), { tone: "lo" }),
    );
  out.push(hardware(slot, plan));
  // Cara lateral: rejilla de ranuras cerradas y una placa con la "etiqueta" del equipo dueño.
  const side = plan.x + plan.w;
  const slotPath = (y0: number, y1: number, z: number, h: number) =>
    k.pathOf(
      atAll([
        [side, y0, z],
        [side, y1, z],
        [side, y1, z + h],
        [side, y0, z + h],
      ]),
      true,
    );
  out.push(
    L([0, 1, 2, 3, 4].map((i) => slotPath(plan.y + 34, plan.y + 58, MOD_Z + 16 + i * 4.4, 1.6)).join(""), {
      tone: "lo",
    }),
  );
  out.push(L(slotPath(plan.y + 8, plan.y + 26, MOD_Z + 22, 18), { tone: "lo" }));
  out.push(
    L(
      [0, 1, 2]
        .map((i) =>
          k.segment([side, plan.y + 11, MOD_Z + 36 - i * 4.5], [side, plan.y + 23 - i * 3, MOD_Z + 36 - i * 4.5], P),
        )
        .join(""),
      { tone: "faint", free: true },
    ),
  );
  out.push(
    D(
      atAll([
        [side, plan.y + 10, MOD_Z + 24],
        [side, plan.y + 24, MOD_Z + 24],
      ]),
      { size: 0.4, tone: "lo" },
    ),
  );
  // LED de estado: se enciende con el color del tipo de render.
  const led = [slot.x + 7, plan.y + plan.d - 6];
  out.push(S(k.cylinder(led[0], led[1], 2.2, MOD_TOP, 0.9, P, 20), { tone: "lo" }));
  out.push(
    `<g data-part="led-${slot.id}" data-on="false"><path class="iso-line" data-tone="${TONE[slot.render]}" d="${k.ring(led[0], led[1], 1.5, MOD_TOP + 0.9, P, 20)}" style="stroke-width:1.2"/>${D([at([led[0], led[1], MOD_TOP + 0.9])], { size: 0.9, tone: "hi" })}</g>`,
  );
  out.push(D([at([slot.x - 7, plan.y + plan.d - 6, MOD_TOP])], { size: 0.5, tone: "lo" }));
  // Asa en la cara frontal para tirar del módulo.
  const yF = plan.y + plan.d;
  for (const dx of [-6, 4])
    out.push(S(k.slabOf({ x: slot.x + dx, y: yF, w: 2, d: 3, r: 0.5 }, 38, 4, P, 2), { tone: "mid", crease: "none" }));
  const grip = { x: slot.x - 7, y: yF + 3, w: 14, d: 2.6, r: 1.2 };
  out.push(S(k.slabOf(grip, 37, 6, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  out.push(D([at([slot.x - 5, yF + 4.3, 43]), at([slot.x + 5, yF + 4.3, 43])], { size: 0.4, tone: "lo" }));
  return out.join("");
}

export function build() {
  const body = [base(), rails(), backplane()];
  for (const slot of SLOTS)
    body.push(
      `<g data-part="mod-${slot.id}" data-slot="${slot.id}" transform="${k.translateAlong(P, [0, TRAVEL, 0])}">${module(slot)}</g>`,
    );
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    className: "fig-rack",
    label:
      "Un chasis sobre una base: el shell. En su backplane hay cuatro zócalos unidos por un bus. Cuatro módulos, uno por micro-frontend, se deslizan por rieles y se enchufan cuando su remote termina de cargar; su LED se enciende en el color de su tipo de render. Novedades lleva un ventilador (trabaja en cada request), catálogo y reproductor un chip (su código corre en el navegador) y la guía una pila de hojas ya impresas (se generó en el build).",
    body,
  });
  return { svg, data: { P, TRAVEL, SLOTS, FAN } };
}
