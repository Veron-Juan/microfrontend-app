// Fig 1 · The assembled page. An exploded view of the demo: the shell is the window with the
// layout and the navigation, and it leaves a slot per remote. Each remote is a piece that floats
// above its slot while it downloads from its own server and drops into place when it arrives. If
// its server goes down, the piece doesn't drop, the slot shows the notice and the rest of the page
// stays assembled. The names are plain text, without perspective, so they read at any size.
import * as k from "./kit/iso-kit.ts";
import { faceLabel, type Line } from "./text.ts";

export type Render = "CSR" | "SSR" | "SSG";
export interface Tile {
  id: string;
  title: string;
  render: Render;
  plan: k.Plan;
  /** Where the name goes, as a fraction of the width. Shifts News's so the floating catalog doesn't cover it. */
  labelAt?: number;
}

export const WIDTH = 640;
export const HEIGHT = 420;

const PAGE = { x: -100, y: -86, w: 200, d: 172, r: 7 };
const PAGE_H = 9;
export const TILE_H = 5;
export const HOVER = 64; // height a piece floats at while it downloads

// The slots copy the demo's layout: news on top, catalog and details side by side, the guide at the bottom.
export const TILES: Tile[] = [
  { id: "news", title: "News", render: "SSR", plan: { x: -92, y: -46, w: 184, d: 30, r: 2.5 }, labelAt: 0.76 },
  { id: "catalog", title: "Catalog", render: "CSR", plan: { x: -92, y: -11, w: 112, d: 46, r: 2.5 } },
  { id: "details", title: "Details", render: "CSR", plan: { x: 25, y: -11, w: 67, d: 46, r: 2.5 } },
  { id: "guide", title: "Guide", render: "SSG", plan: { x: -92, y: 40, w: 184, d: 38, r: 2.5 } },
];
const NAV = { x: -92, y: -66, w: 184, d: 14, r: 2.5 };
const TONE: Record<Render, string> = { CSR: "blue", SSR: "amber", SSG: "green" };

// The framing fits what's drawn: the page below and the pieces floating above.
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

/** The vertical edges joining a piece at height z to its slot. The shell recomputes them as it animates. */
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
  // Browser bar: three buttons and the address bar.
  const bar = PAGE.y + 10;
  out.push(L(k.lineOnTop([PAGE.x + 4, PAGE.y + 18], [PAGE.x + PAGE.w - 4, PAGE.y + 18], 0, P), { tone: "faint" }));
  out.push(
    L([0, 1, 2].map((i) => k.ring(PAGE.x + 12 + i * 7, bar, 2.2, 0, P, 18)).join(""), {
      tone: "mid",
    }),
  );
  out.push(L(k.planOutline({ x: PAGE.x + 40, y: bar - 4, w: 130, d: 8, r: 4 }, 0, P, 6), { tone: "lo" }));
  // The app's navigation belongs to the shell: no remote serves it.
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
    // The empty slot the shell reserves in the layout.
    out.push(
      `<g data-part="slot-${tile.id}">${L(k.planOutline(tile.plan, 0, P, 3), { tone: "mid", dashed: true })}</g>`,
    );
    out.push(
      `<path class="iso-halo" data-part="shadow-${tile.id}" d="${k.haloOf(k.insetPlan(tile.plan, 3), 0, 0.1, P)}" style="filter:blur(5px);opacity:0"/>`,
    );
    // The notice the shell shows if the remote doesn't arrive.
    const [cx, cy] = centerOf(tile.plan);
    out.push(
      `<g data-part="fail-${tile.id}" data-on="false">${L(k.planOutline(k.insetPlan(tile.plan, 2), 0, P, 3), { tone: "red", dashed: true })}${label([cx, cy], 0, [{ text: "unavailable", className: "fig-fail", size: 5 }])}</g>`,
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

/** The shell's label, outside the window and joined to its side by a line. */
function shellCallout() {
  const anchor = at([PAGE.x + 34, PAGE.y + PAGE.d, -PAGE_H / 2]);
  const [x, y] = [anchor[0] + 18, anchor[1] + 56];
  return `<g class="fig-callout" data-slot="shell">${[
    `<path class="iso-line" data-tone="mid" d="M${tenth(anchor[0])} ${tenth(anchor[1])}L${tenth(x)} ${tenth(y - 14)}"/>`,
    D([anchor], { size: 1.4, tone: "hi" }),
    `<text class="fig-name" x="${tenth(x)}" y="${tenth(y)}" text-anchor="middle">Shell (host)</text>`,
    `<text class="fig-meta" data-part="origin-shell" x="${tenth(x)}" y="${tenth(y + 14)}" text-anchor="middle">layout and navigation</text>`,
  ].join("")}</g>`;
}

export function build() {
  const body = [page()];
  // Back to front, so the pieces in front cover the ones behind.
  for (const t of TILES) body.push(tile(t));
  body.push(shellCallout());
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    className: "fig-assembly",
    label:
      "An exploded view of the demo. At the bottom, the browser window: it's the shell, with the navigation bar and four dotted slots. Above it float four named pieces: News (SSR), Catalog and Details (CSR) and Guide (SSG). Each piece drops into its slot when its remote finishes downloading from its own server. If a server goes down, its piece stays up top, the slot shows a notice and the others stay in place.",
    body,
  });
  return { svg, data: { P, HOVER, TILES } };
}
