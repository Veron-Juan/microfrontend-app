// Fig 2 · Where and when the HTML is built. A board seen head-on, without perspective, so all the
// text reads straight. The columns are the places and moments (the build, before any request; the
// server, on every request; the browser, on your screen) and the rows, the three kinds of
// rendering. Each row carries loose pieces (components and data) that come together into a page in
// a single cell: the one for its kind of rendering. SSG builds it at build time, SSR on the server
// and CSR in the browser, so the lit cells form a diagonal. The shell measures the timings live.
import * as k from "./kit/iso-kit.ts";

export type LaneId = "SSG" | "SSR" | "CSR";
export type ColumnId = "build" | "server" | "browser";
export type Flat = [number, number];
export interface Lane {
  id: LaneId;
  /** Vertical center of the row. */
  y: number;
  /** The remote on this page that renders this way. */
  app: string;
  /** The column where its HTML is built. */
  builds: ColumnId;
}

const LABEL_W = 112; // the column with each row's labels
const COL = { w: 164, gap: 8 };
const ROW = { h: 80, gap: 10, top: 64 };

export const WIDTH = 640;
export const HEIGHT = ROW.top + ROW.h * 3 + ROW.gap * 2 + 2;

const COLUMN_TEXT: Record<ColumnId, [string, string]> = {
  build: ["BUILD", "before the request"],
  server: ["SERVER", "on every request"],
  browser: ["BROWSER", "on your screen"],
};
/** The horizontal center of each column. */
export const COLUMNS = Object.fromEntries(
  (Object.keys(COLUMN_TEXT) as ColumnId[]).map((id, i) => [id, LABEL_W + COL.gap + COL.w / 2 + i * (COL.w + COL.gap)]),
) as Record<ColumnId, number>;

const rowY = (i: number) => ROW.top + ROW.h / 2 + i * (ROW.h + ROW.gap);
export const LANES: Lane[] = [
  { id: "SSG", y: rowY(0), app: "Guide", builds: "build" },
  { id: "SSR", y: rowY(1), app: "News", builds: "server" },
  { id: "CSR", y: rowY(2), app: "Catalog", builds: "browser" },
];

// The pieces: six blocks that travel loose and, when assembled, come together in a 3×2 grid.
const PIECE = { w: 15, h: 10, depth: 2.6 };
export const LOOSE: Flat[] = [
  [-29, -9],
  [-6, -13],
  [19, -8],
  [-20, 8],
  [3, 10],
  [28, 7],
];
export const TIGHT: Flat[] = [-1, 0, 1].flatMap((col) =>
  [-0.5, 0.5].map((row): Flat => [col * (PIECE.w + 1), row * (PIECE.h + PIECE.depth + 1)]),
);
const PAGE = { w: 58, h: 36 };
/** The pieces and the page sit in the middle of the row: the browser bar goes above and the note below. */
const CONTENT_DY = 0;
/** The request travels along the top of the row, at the height of the address bar. */
const REQUEST_DY = -ROW.h / 2 + 10;

const TONE: Record<LaneId, k.LineTone> = { CSR: "blue", SSR: "amber" as k.LineTone, SSG: "green" };
const tenth = (value: number) => Math.round(value * 10) / 10;
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
const line = ([x0, y0]: Flat, [x1, y1]: Flat) => `M${tenth(x0)} ${tenth(y0)}L${tenth(x1)} ${tenth(y1)}`;
const rect = (className: string, x: number, y: number, w: number, h: number, r: number, extra = "") =>
  `<rect class="${className}"${extra} x="${tenth(x)}" y="${tenth(y)}" width="${tenth(w)}" height="${tenth(h)}" rx="${r}"/>`;
const text = (className: string, x: number, y: number, size: number, value: string, extra = "") =>
  `<text class="${className}"${extra} x="${tenth(x)}" y="${tenth(y)}" font-size="${size}" dominant-baseline="central">${value}</text>`;
const cellOf = (column: ColumnId, y: number) => ({
  x: COLUMNS[column] - COL.w / 2,
  y: y - ROW.h / 2,
  w: COL.w,
  h: ROW.h,
});

/** The column headings and, below them, an arrow: time runs from left to right. */
function header() {
  const out: string[] = [];
  for (const [id, x] of Object.entries(COLUMNS) as [ColumnId, number][]) {
    const [name, when] = COLUMN_TEXT[id];
    out.push(
      `<g text-anchor="middle">${text("fig-head fig-col", x, 16, 11.5, name)}${text("fig-meta fig-when", x, 32, 9.5, when)}</g>`,
    );
  }
  const [x0, x1, y] = [COLUMNS.build - COL.w / 2 + 2, COLUMNS.browser + COL.w / 2 - 2, 47];
  out.push(
    L(line([x0, y], [x1, y]) + line([x1 - 5, y - 3], [x1, y]) + line([x1 - 5, y + 3], [x1, y]), { tone: "mid" }),
  );
  out.push(text("fig-meta fig-when", 4, y, 9.5, "time"));
  return out.join("");
}

function lane(l: Lane) {
  const out: string[] = [];
  // The row's label: the kind of rendering in its color, the remote that uses it and how long it took.
  out.push(
    `<g data-render="${l.id}">${text("fig-lane fig-row", 4, l.y - 14, 24, l.id)}${text("fig-app", 4, l.y + 6, 11.5, l.app)}${text("fig-meta fig-ms", 4, l.y + 21, 10, "", ` data-part="ms-${l.id}"`)}</g>`,
  );
  for (const column of Object.keys(COLUMNS) as ColumnId[]) {
    const { x, y, w, h } = cellOf(column, l.y);
    out.push(rect("fig-box", x, y, w, h, 8));
    // The browser's is a window: three buttons and the address bar.
    if (column === "browser") {
      out.push(
        [0, 1, 2].map((i) => `<circle class="fig-dot" cx="${x + 10 + i * 7}" cy="${y + 10}" r="2"/>`).join("") +
          L(line([x, y + 20], [x + w, y + 20]), { tone: "faint" }),
      );
      out.push(
        `<g data-part="screen-${l.id}" data-on="false" data-render="${l.id}">${rect("fig-ring", x, y, w, h, 8)}</g>`,
      );
    }
  }
  // The cell where the HTML is built: it lights up when the pieces come together there.
  const { x, y, w, h } = cellOf(l.builds, l.y);
  out.push(
    `<g data-part="cell-${l.id}" data-on="false" data-render="${l.id}">${rect("fig-cell", x, y, w, h, 8)}${rect("fig-ring", x, y, w, h, 8)}${text("fig-lane fig-note", x + w / 2, y + h - 10, 9.5, "the HTML is built here", ' text-anchor="middle"')}</g>`,
  );
  // The request's path: from the browser to the server, along the top of the row.
  const reqY = l.y + REQUEST_DY;
  out.push(L(line([COLUMNS.server, reqY], [COLUMNS.browser, reqY]), { tone: "faint", dotted: true }));
  out.push(
    `<g data-part="req-${l.id}" data-on="false"><g transform="translate(${COLUMNS.browser} ${reqY})">${rect("fig-pill", -24, -7, 48, 14, 7)}${text("fig-head fig-req", 0, 0.5, 8, "request", ' text-anchor="middle"')}</g></g>`,
  );
  return out.join("");
}

/** A row's pieces, drawn in the build cell. The shell moves them and puts them together. */
function content(l: Lane) {
  const pieces = LOOSE.map(
    ([dx, dy], i) =>
      `<g data-part="cube-${l.id}-${i}" transform="translate(${dx} ${dy})">${rect("fig-piece-base", -PIECE.w / 2, -PIECE.h / 2 + PIECE.depth, PIECE.w, PIECE.h, 2)}${rect("fig-piece", -PIECE.w / 2, -PIECE.h / 2, PIECE.w, PIECE.h, 2)}</g>`,
  );
  // The assembled page: a sheet with its layout painted in the render's color.
  const [px, py] = [-PAGE.w / 2, -PAGE.h / 2];
  const rows = [
    line([px + 24, py + 16], [px + PAGE.w - 6, py + 16]),
    line([px + 24, py + 22], [px + PAGE.w - 12, py + 22]),
    line([px + 24, py + 28], [px + PAGE.w - 9, py + 28]),
  ];
  const page = `<g data-part="page-${l.id}" data-render="${l.id}" style="opacity:0">${rect("fig-piece-base", px, py + PIECE.depth, PAGE.w, PAGE.h, 3)}${rect("fig-page", px, py, PAGE.w, PAGE.h, 3)}${rect("fig-bar", px + 6, py + 5, PAGE.w - 12, 5, 1.5)}${rect("fig-block", px + 6, py + 14, 14, 16, 1.5)}${L(rows.join(""), { tone: TONE[l.id] })}</g>`;
  return `<g data-part="content-${l.id}" transform="translate(0 0)"><g transform="translate(${COLUMNS.build} ${l.y + CONTENT_DY})"><g data-part="cubes-${l.id}">${pieces.join("")}</g>${page}</g></g>`;
}

export function build() {
  const body = [header()];
  for (const l of LANES) body.push(lane(l));
  // The pieces go last so they pass over every cell.
  for (const l of LANES) body.push(content(l));
  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    className: "fig-render",
    label:
      "A three-by-three board. The columns are the build (before the request), the server (on every request) and the browser (on your screen); the rows, SSG, SSR and CSR. Each row carries loose pieces that come together into a page in a single cell: SSG at build time, SSR on the server when the request arrives, CSR in the browser after downloading the pieces. The cells where the HTML is built light up and form a diagonal.",
    body,
  });
  return { svg, data: { LANES, COLUMNS, LOOSE, TIGHT } };
}
