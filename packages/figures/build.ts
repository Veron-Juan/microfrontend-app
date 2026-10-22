import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.ts";
import * as assembly from "./assembly.ts";
import * as render from "./render.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "dist");
mkdirSync(OUT, { recursive: true });

const figures = { assembly: assembly.build(), render: render.build() };
const css = k.ISO_CSS + "\n" + readFileSync(join(HERE, "extra.css"), "utf8");

writeFileSync(
  join(OUT, "figures.js"),
  `// Generado por packages/figures/build.ts. No editar a mano.\nexport const FIGURES = ${JSON.stringify(figures)};\n`,
);
// Los tipos salen de los mismos módulos que dibujan, así el shell no puede desalinearse de las figuras.
writeFileSync(
  join(OUT, "figures.d.ts"),
  `// Generado por packages/figures/build.ts. No editar a mano.
import type { Point3, Projection } from "../kit/iso-kit.ts";
import type { Tile } from "../assembly.ts";
import type { ColumnId, Lane } from "../render.ts";
export declare const FIGURES: {
  assembly: { svg: string; data: { P: Projection; HOVER: number; TILES: Tile[] } };
  render: {
    svg: string;
    data: { P: Projection; LANES: Lane[]; COLUMNS: Record<ColumnId, number>; LOOSE: Point3[]; TIGHT: Point3[] };
  };
};
`,
);
writeFileSync(join(OUT, "iso.css"), css);

// Páginas sueltas para revisar cada figura fuera del shell.
for (const theme of ["dark", "light"] as const) {
  for (const [name, fig] of Object.entries(figures)) {
    const body = k.plateHtml({
      fig: "Fig",
      title: name,
      hint: "preview",
      readout: "",
      body: `<div class="iso-stage">${fig.svg}</div>`,
    });
    const page = k
      .pageHtml({ title: name, theme, body, width: 900 })
      .replace("</style>", readFileSync(join(HERE, "extra.css"), "utf8") + "</style>");
    const plugged = `<script>document.querySelectorAll('[data-slot]').forEach(g=>{g.setAttribute('transform','translate(0 0)');g.setAttribute('data-landed','')});document.querySelectorAll('[data-part^=guides-],[data-part^=slot-]').forEach(g=>g.remove());document.querySelectorAll('[data-on]:not([data-part^=fail-]):not([data-part^=req-])').forEach(g=>g.dataset.on='true')</script>`;
    writeFileSync(join(OUT, `${name}-${theme}.html`), page.replace("</body>", plugged + "</body>"));
  }
}
console.info("figuras:", Object.keys(figures).join(", "), "→ dist/");
