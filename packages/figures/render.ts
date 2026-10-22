// Fig 2 · Dónde y cuándo se arma el HTML. Una cuadrícula: las columnas son los lugares y los
// momentos (el build, antes de cualquier request; el servidor, en cada request; el navegador, en
// tu pantalla) y las filas, los tres tipos de render. Cada fila lleva un montón de piezas sueltas
// (componentes y datos) que se juntan en una página en una sola celda: la de su tipo de render.
// SSG la arma en el build, SSR en el servidor y CSR en el navegador, así que las celdas
// encendidas forman una diagonal. Los tiempos los mide el shell en vivo.
import * as k from "./kit/iso-kit.ts";
import { faceLabel } from "./text.ts";

export type LaneId = "SSG" | "SSR" | "CSR";
export type ColumnId = "build" | "server" | "browser";
export interface Lane {
  id: LaneId;
  y: number;
  /** El remote de esta página que renderiza así. */
  app: string;
  /** La columna donde se arma su HTML. */
  builds: ColumnId;
}

export const WIDTH = 640;
export const HEIGHT = 320;

const COL_W = 74;
export const COLUMNS: Record<ColumnId, number> = { build: -96, server: -16, browser: 64 };
const COLUMN_TEXT: Record<ColumnId, [string, string]> = {
  build: ["BUILD", "antes de la request"],
  server: ["SERVIDOR", "en cada request"],
  browser: ["NAVEGADOR", "en tu pantalla"],
};
export const LANES: Lane[] = [
  { id: "SSG", y: -40, app: "Guía", builds: "build" },
  { id: "SSR", y: 6, app: "Novedades", builds: "server" },
  { id: "CSR", y: 52, app: "Catálogo", builds: "browser" },
];
const LANE_D = 42;
const LABEL_X = -168; // centro de la columna de rótulos de cada fila
const PLATE = { x: -196, y: -90, w: 302, d: 168, r: 9 };
const PLATE_H = 9;
const PAD = { w: 58, d: 32, h: 1.6 };
export const PAD_TOP = PAD.h;

// Las piezas: seis bloques que viajan sueltos y, al armarse, se juntan en una grilla de 3×2.
const CUBE = { w: 10.4, d: 8.4, h: 4.6 };
export const LOOSE: k.Point3[] = [
  [-15, -8, 0],
  [2, -9.5, 0],
  [16, -2, 0],
  [-10, 7, 0],
  [7, 7.5, 0],
  [-2, -2, CUBE.h],
];
export const TIGHT: k.Point3[] = [-1, 0, 1].flatMap((col) =>
  [-0.5, 0.5].map((row): k.Point3 => [col * (CUBE.w + 0.4), row * (CUBE.d + 0.4), 0]),
);
const PAGE = { w: 34, d: 20 };

export const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H, 0), [0, PLATE.y, 10]], WIDTH, HEIGHT, {
  pad: 22,
  azimuth: 62,
  elevation: 36,
});

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
const TONE: Record<LaneId, k.LineTone> = { CSR: "blue", SSR: "amber" as k.LineTone, SSG: "green" };
const cellPlan = (column: ColumnId, y: number, inset = 0): k.Plan => ({
  x: COLUMNS[column] - COL_W / 2 + inset,
  y: y - LANE_D / 2 + inset,
  w: COL_W - inset * 2,
  d: LANE_D - inset * 2,
  r: 3,
});

function board() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H, PLATE_H, P)}"/>`];
  out.push(
    S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), {
      tone: "mid",
      inner: L(k.sideSeam(PLATE, -PLATE_H / 2, P, 8), { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  // Encabezados de columna y una flecha de tiempo debajo: de izquierda a derecha pasa el tiempo.
  const headY = PLATE.y + 12;
  for (const [id, x] of Object.entries(COLUMNS) as [ColumnId, number][]) {
    const [name, when] = COLUMN_TEXT[id];
    out.push(
      faceLabel([x, headY], 0, P, [
        { text: name, className: "fig-head fig-col", size: 6.4 },
        { text: when, className: "fig-meta", size: 4.2 },
      ]),
    );
  }
  const arrowY = PLATE.y + 21;
  const [x0, x1] = [COLUMNS.build - COL_W / 2 + 4, COLUMNS.browser + COL_W / 2 - 4];
  out.push(L(k.lineOnTop([x0, arrowY], [x1, arrowY], 0, P), { tone: "mid" }));
  out.push(
    L(k.lineOnTop([x1 - 4, arrowY - 2], [x1, arrowY], 0, P) + k.lineOnTop([x1 - 4, arrowY + 2], [x1, arrowY], 0, P), {
      tone: "mid",
    }),
  );
  // Separadores de columna grabados en la base.
  for (const x of [COLUMNS.build - COL_W / 2 - 3, COLUMNS.server - COL_W / 2 - 3, COLUMNS.browser - COL_W / 2 - 3])
    out.push(L(k.lineOnTop([x, arrowY + 4], [x, PLATE.y + PLATE.d - 5], 0, P), { tone: "faint", dashed: true }));
  return out.join("");
}

function lane(l: Lane) {
  const out: string[] = [];
  // Rótulo de la fila: el tipo de render en su color y el remote que lo usa en esta página.
  out.push(
    faceLabel([LABEL_X, l.y], 0, P, [
      { text: l.id, className: "fig-lane fig-row", size: 10, attrs: `data-render="${l.id}"` },
      { text: l.app, className: "fig-meta", size: 4.6 },
    ]),
  );
  // La celda donde se arma el HTML: se enciende cuando las piezas se juntan ahí.
  const cell = cellPlan(l.builds, l.y, 1.5);
  out.push(
    `<g data-part="cell-${l.id}" data-on="false"><path class="fig-cell" data-render="${l.id}" d="${k.planOutline(cell, 0, P, 3)}"/>${L(k.planOutline(cell, 0, P, 3), { tone: TONE[l.id] })}${faceLabel([cell.x + cell.w / 2, cell.y + cell.d - 3.6], 0, P, [{ text: "aquí se arma el HTML", className: "fig-lane fig-note", size: 4.6, attrs: `data-render="${l.id}"` }])}</g>`,
  );
  // Una base en cada celda. La del navegador es una ventana, con sus tres botones.
  for (const column of Object.keys(COLUMNS) as ColumnId[]) {
    const pad = { x: COLUMNS[column] - PAD.w / 2, y: l.y - PAD.d / 2 - 3, w: PAD.w, d: PAD.d, r: 2.2 };
    out.push(S(k.slabOf(pad, 0, PAD.h, P, 3, 0.4), { tone: "mid", crease: "lo" }));
    if (column === "browser") {
      out.push(
        L(
          [0, 1, 2].map((i) => k.ring(pad.x + 4 + i * 3.4, pad.y + 3.4, 1, PAD.h, P, 12)).join("") +
            k.lineOnTop([pad.x + 1.5, pad.y + 6.2], [pad.x + pad.w - 1.5, pad.y + 6.2], PAD.h, P),
          { tone: "lo" },
        ),
      );
      out.push(
        `<g data-part="screen-${l.id}" data-on="false">${L(k.planOutline(k.insetPlan(pad, 1.2), PAD.h, P, 3), { tone: TONE[l.id] })}</g>`,
      );
    }
  }
  // El camino de la request: del navegador al servidor, por el fondo de la fila.
  const reqY = l.y - PAD.d / 2 - 6;
  out.push(
    L(k.lineOnTop([COLUMNS.server, reqY], [COLUMNS.browser, reqY], 0, P), {
      tone: "faint",
      dotted: true,
    }),
  );
  out.push(
    `<g data-part="req-${l.id}" data-on="false" transform="${k.translateAlong(P, [0, 0, 0])}">${S(k.slabOf({ x: COLUMNS.browser - 12, y: reqY - 3, w: 24, d: 6, r: 3 }, 0, 1.4, P, 4, 0.3), { tone: "hi", crease: "lo" })}${faceLabel([COLUMNS.browser, reqY], 1.4, P, [{ text: "request", className: "fig-head", size: 4 }])}</g>`,
  );
  return out.join("");
}

/** Las piezas de una fila, dibujadas en la celda del build. El shell las mueve y las junta. */
function content(l: Lane) {
  const [cx, cy] = [COLUMNS.build, l.y - 3];
  // De atrás hacia adelante según su lugar suelto, para que se tapen bien.
  const depth = ([dx, dy, dz]: k.Point3) => k.depthOf([cx + dx, cy + dy, dz], P);
  const order = LOOSE.map((offset, i) => ({ offset, i })).sort((a, b) => depth(a.offset) - depth(b.offset));
  const cubes = order.map(({ offset, i }) => {
    const plan = { x: cx - CUBE.w / 2, y: cy - CUBE.d / 2, w: CUBE.w, d: CUBE.d, r: 0.6 };
    return `<g data-part="cube-${l.id}-${i}" transform="${k.translateAlong(P, offset)}">${S(k.slabOf(plan, PAD_TOP, CUBE.h, P, 2, 0.3), { tone: "hi", crease: "lo" })}</g>`;
  });
  // La página armada: una hoja con su layout pintado del color del render.
  const sheet = { x: cx - PAGE.w / 2, y: cy - PAGE.d / 2, w: PAGE.w, d: PAGE.d, r: 0.8 };
  const z = PAD_TOP + 1.2;
  const rows = [
    k.planOutline({ x: sheet.x + 2.5, y: sheet.y + 2.5, w: sheet.w - 5, d: 3.4, r: 0.8 }, z, P, 2),
    k.planOutline({ x: sheet.x + 2.5, y: sheet.y + 8.5, w: 12, d: 9, r: 0.8 }, z, P, 2),
    k.lineOnTop([sheet.x + 17.5, sheet.y + 9.5], [sheet.x + sheet.w - 2.5, sheet.y + 9.5], z, P),
    k.lineOnTop([sheet.x + 17.5, sheet.y + 12.5], [sheet.x + sheet.w - 7, sheet.y + 12.5], z, P),
    k.lineOnTop([sheet.x + 17.5, sheet.y + 15.5], [sheet.x + sheet.w - 4, sheet.y + 15.5], z, P),
  ];
  const page = `<g data-part="page-${l.id}" style="opacity:0">${S(k.slabOf(sheet, PAD_TOP, 1.2, P, 2, 0.2), { tone: "hi", crease: "lo" })}<path class="fig-cell" data-render="${l.id}" style="opacity:.22" d="${k.planOutline(k.insetPlan(sheet, 0.5), z, P, 2)}"/>${L(rows.join(""), { tone: TONE[l.id], free: true })}</g>`;
  return `<g data-part="content-${l.id}" transform="${k.translateAlong(P, [0, 0, 0])}"><g data-part="cubes-${l.id}">${cubes.join("")}</g>${page}</g>`;
}

export function build() {
  const body = [board()];
  for (const l of LANES) body.push(lane(l), content(l));
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    className: "fig-render",
    label:
      "Una cuadrícula de tres por tres. Las columnas son el build (antes de la request), el servidor (en cada request) y el navegador (en tu pantalla); las filas, SSG, SSR y CSR. Cada fila lleva piezas sueltas que se juntan en una página en una sola celda: SSG en el build, SSR en el servidor cuando llega la request, CSR en el navegador después de descargar las piezas. Las celdas donde se arma el HTML se encienden y forman una diagonal.",
    body,
  });
  return { svg, data: { P, LANES, COLUMNS, LOOSE, TIGHT } };
}
