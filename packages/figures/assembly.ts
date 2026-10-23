// Fig 1 · La página armada. Una vista explotada de la demo: el shell es la ventana con el layout
// y la navegación, y deja un hueco por remote. Cada remote es una pieza que flota sobre su hueco
// mientras se descarga desde su propio servidor y baja a su lugar cuando llega. Si su servidor
// cae, la pieza no baja, el hueco muestra el aviso y el resto de la página sigue armada.
// Los nombres van en texto plano, sin perspectiva, para que se lean a cualquier tamaño.
import * as k from "./kit/iso-kit.ts";
import { faceLabel, type Line } from "./text.ts";

export type Render = "CSR" | "SSR" | "SSG";
export interface Tile {
  id: string;
  title: string;
  render: Render;
  plan: k.Plan;
  /** Dónde va el nombre, como fracción del ancho. Corre el de novedades para que no lo tape el catálogo al flotar. */
  labelAt?: number;
}

export const WIDTH = 640;
export const HEIGHT = 420;

const PAGE = { x: -100, y: -86, w: 200, d: 172, r: 7 };
const PAGE_H = 9;
export const TILE_H = 5;
export const HOVER = 64; // altura a la que flota una pieza mientras se descarga

// Los huecos copian el layout de la demo: novedades arriba, catálogo y ficha lado a lado, la guía abajo.
export const TILES: Tile[] = [
  { id: "news", title: "Novedades", render: "SSR", plan: { x: -92, y: -46, w: 184, d: 30, r: 2.5 }, labelAt: 0.76 },
  { id: "catalog", title: "Catálogo", render: "CSR", plan: { x: -92, y: -11, w: 112, d: 46, r: 2.5 } },
  { id: "details", title: "Ficha", render: "CSR", plan: { x: 25, y: -11, w: 67, d: 46, r: 2.5 } },
  { id: "guide", title: "Guía", render: "SSG", plan: { x: -92, y: 40, w: 184, d: 38, r: 2.5 } },
];
const NAV = { x: -92, y: -66, w: 184, d: 14, r: 2.5 };
const TONE: Record<Render, string> = { CSR: "blue", SSR: "amber", SSG: "green" };

// El encuadre se ajusta a lo que se dibuja: la página abajo y las piezas flotando arriba.
export const P = k.fitProjection(
  [...k.boxCorners(PAGE, -PAGE_H, 0), ...TILES.flatMap((tile) => k.boxCorners(tile.plan, HOVER, HOVER + TILE_H))],
  WIDTH,
  HEIGHT,
  { pad: 24, azimuth: 56, elevation: 32 },
);

const at = (point: k.Point3) => k.iso(point, P);
const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
const D = (points: k.Flat[], style?: Parameters<typeof k.dotsSvg>[1]) => k.dotsSvg(points, style);
const tenth = (value: number) => Math.round(value * 10) / 10;
const centerOf = ({ x, y, w, d }: k.Plan): k.Plane => [x + w / 2, y + d / 2];

const label = (at: k.Plane, z: number, lines: Line[]) => faceLabel(at, z, P, lines);

/** Las aristas verticales que unen una pieza a la altura z con su hueco. El shell las recalcula al animar. */
function guides(plan: k.Plan, z: number, projection: k.Projection) {
  if (z < 0.5) return "";
  return k
    .corners(plan, 1)
    .map(([x, y]) => k.segment([x, y, z], [x, y, 0], projection))
    .join("");
}

function page() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PAGE, -PAGE_H, PAGE_H, P)}"/>`];
  out.push(
    S(k.slabOf(PAGE, -PAGE_H, PAGE_H, P, 8, 1.6), {
      tone: "mid",
      inner: L(k.sideSeam(PAGE, -PAGE_H / 2, P, 8), { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(PAGE, 4), 0, P), { tone: "lo" }));
  // Barra del navegador: tres botones y la barra de direcciones.
  const bar = PAGE.y + 10;
  out.push(L(k.lineOnTop([PAGE.x + 4, PAGE.y + 18], [PAGE.x + PAGE.w - 4, PAGE.y + 18], 0, P), { tone: "faint" }));
  out.push(
    L([0, 1, 2].map((i) => k.ring(PAGE.x + 12 + i * 7, bar, 2.2, 0, P, 18)).join(""), {
      tone: "mid",
    }),
  );
  out.push(L(k.planOutline({ x: PAGE.x + 40, y: bar - 4, w: 130, d: 8, r: 4 }, 0, P, 6), { tone: "lo" }));
  // La navegación de la app es del shell: no la sirve ningún remote.
  out.push(S(k.slabOf(NAV, 0, 2.2, P, 3, 0.4), { tone: "mid", crease: "lo" }));
  out.push(D([at([NAV.x + 8, NAV.y + NAV.d / 2, 2.2])], { size: 1.6, tone: "hi" }));
  out.push(
    L(
      [0, 1, 2, 3]
        .map((i) =>
          k.lineOnTop([NAV.x + 22 + i * 16, NAV.y + NAV.d / 2], [NAV.x + 32 + i * 16, NAV.y + NAV.d / 2], 2.2, P),
        )
        .join(""),
      { tone: "lo", free: true },
    ),
  );
  for (const tile of TILES) {
    // El hueco vacío que el shell reserva en el layout.
    out.push(
      `<g data-part="slot-${tile.id}">${L(k.planOutline(tile.plan, 0, P, 3), { tone: "mid", dashed: true })}</g>`,
    );
    out.push(
      `<path class="iso-halo" data-part="shadow-${tile.id}" d="${k.haloOf(k.insetPlan(tile.plan, 3), 0, 0.1, P)}" style="filter:blur(5px);opacity:0"/>`,
    );
    // El aviso que el shell pone si el remote no llega.
    const [cx, cy] = centerOf(tile.plan);
    out.push(
      `<g data-part="fail-${tile.id}" data-on="false">${L(k.planOutline(k.insetPlan(tile.plan, 2), 0, P, 3), { tone: "red", dashed: true })}${label([cx, cy], 0, [{ text: "sin servicio", className: "fig-fail", size: 5 }])}</g>`,
    );
  }
  return out.join("");
}

function tile(t: Tile) {
  const { plan } = t;
  const [cx, cy] = [plan.x + plan.w * (t.labelAt ?? 0.5), plan.y + plan.d / 2];
  const out = [
    `<path class="iso-line" data-part="guides-${t.id}" data-tone="lo" data-dotted="" d="${guides(plan, HOVER, P)}"/>`,
  ];
  const body = [
    S(k.slabOf(plan, 0, TILE_H, P, 3, 0.6), { tone: "hi", crease: "lo" }),
    `<path class="fig-tint" data-render="${t.render}" d="${k.planOutline(k.insetPlan(plan, 0.6), TILE_H, P, 3)}"/>`,
    `<g data-part="ring-${t.id}" data-on="false">${L(k.planOutline(k.insetPlan(plan, 2.4), TILE_H, P, 3), { tone: TONE[t.render] as k.LineTone })}</g>`,
    label([cx, cy], TILE_H, [
      { text: t.title, className: "fig-name", size: 8 },
      { text: t.render, className: "fig-meta", size: 4.6, part: `meta-${t.id}` },
    ]),
  ];
  out.push(
    `<g data-part="tile-${t.id}" data-slot="${t.id}" transform="${k.translateAlong(P, [0, 0, HOVER])}">${body.join("")}</g>`,
  );
  return out.join("");
}

/** La etiqueta del shell, afuera de la ventana y unida a su costado con una línea. */
function shellCallout() {
  const anchor = at([PAGE.x + 34, PAGE.y + PAGE.d, -PAGE_H / 2]);
  const [x, y] = [anchor[0] + 18, anchor[1] + 56];
  return `<g class="fig-callout" data-slot="shell">${[
    `<path class="iso-line" data-tone="mid" d="M${tenth(anchor[0])} ${tenth(anchor[1])}L${tenth(x)} ${tenth(y - 14)}"/>`,
    D([anchor], { size: 1.4, tone: "hi" }),
    `<text class="fig-name" x="${tenth(x)}" y="${tenth(y)}" text-anchor="middle">Shell (host)</text>`,
    `<text class="fig-meta" data-part="origin-shell" x="${tenth(x)}" y="${tenth(y + 14)}" text-anchor="middle">layout y navegación</text>`,
  ].join("")}</g>`;
}

export function build() {
  const body = [page()];
  // De atrás hacia adelante, para que las piezas de adelante tapen a las de atrás.
  for (const t of TILES) body.push(tile(t));
  body.push(shellCallout());
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    className: "fig-assembly",
    label:
      "Una vista explotada de la demo. Abajo, la ventana del navegador: es el shell, con la barra de navegación y cuatro huecos punteados. Arriba flotan cuatro piezas con su nombre: Novedades (SSR), Catálogo y Ficha (CSR) y Guía (SSG). Cada pieza baja a su hueco cuando su remote termina de descargarse desde su propio servidor. Si un servidor cae, su pieza se queda arriba, el hueco muestra un aviso y las demás siguen en su lugar.",
    body,
  });
  return { svg, data: { P, HOVER, TILES } };
}
