import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as rack from "./rack.mjs";
import * as render from "./render.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "dist");
mkdirSync(OUT, { recursive: true });

const figures = { rack: rack.build(), render: render.build() };
const css = k.ISO_CSS + "\n" + readFileSync(join(HERE, "extra.css"), "utf8");

writeFileSync(join(OUT, "figures.js"), `// Generado por packages/figures/build.mjs. No editar a mano.\nexport const FIGURES = ${JSON.stringify(figures)};\n`);
writeFileSync(join(OUT, "iso.css"), css);

// Páginas sueltas para revisar cada figura fuera del shell.
for (const theme of ["dark", "light"]) {
  for (const [name, fig] of Object.entries(figures)) {
    const body = k.plateHtml({ fig: "Fig", title: name, hint: "preview", readout: "", body: `<div class="iso-stage">${fig.svg}</div>` });
    const page = k.pageHtml({ title: name, theme, body, width: 900 }).replace("</style>", readFileSync(join(HERE, "extra.css"), "utf8") + "</style>");
    const plugged = `<script>document.querySelectorAll('[data-slot]').forEach(g=>g.setAttribute('transform','translate(0 0)'));document.querySelectorAll('[data-on]').forEach(g=>g.dataset.on='true');document.querySelectorAll('[data-part=blank-SSR]').forEach(g=>g.dataset.on='false')</script>`;
    writeFileSync(join(OUT, `${name}-${theme}.html`), page.replace("</body>", plugged + "</body>"));
  }
}
console.log("figuras:", Object.keys(figures).join(", "), "→ dist/");
