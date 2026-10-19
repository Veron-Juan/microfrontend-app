import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Guide } from "./Guide.js";

// Static Site Generation: este script corre UNA vez, en CI, antes del deploy.
// Lo que sale de aquí son archivos .html que cualquier CDN puede servir.
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const t0 = performance.now();

const hours = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
const channels = [
  { number: 101, name: "Deportes 1", slots: [{ title: "Previa", span: 1 }, { title: "Final continental", span: 2 }, { title: "Resumen", span: 1 }, { title: "Análisis", span: 2 }] },
  { number: 205, name: "Docs", slots: [{ title: "Andes profundos", span: 2 }, { title: "Océanos", span: 1 }, { title: "Ciudades", span: 2 }, { title: "Archivo", span: 1 }] },
  { number: 310, name: "Series", slots: [{ title: "La frontera T2", span: 1 }, { title: "La frontera T2", span: 1 }, { title: "Estreno", span: 3 }, { title: "Clásicos", span: 1 }] },
  { number: 402, name: "Noticias 24", slots: [{ title: "Noticiero 24", span: 3 }, { title: "Entrevista", span: 1 }, { title: "Cierre", span: 2 }] },
  { number: 515, name: "Kids", slots: [{ title: "Taller de robots", span: 2 }, { title: "Cuentos", span: 2 }, { title: "Repetición", span: 2 }] },
];

const builtAt = new Date();
const built = builtAt.toLocaleDateString("es", { day: "2-digit", month: "short" }) + " a las " + builtAt.toLocaleTimeString("es", { hour12: false });
renderToStaticMarkup(h(Guide, { built, channels, hours, buildMs: 0 }));
const buildMs = Math.max(1, Math.round(performance.now() - t0));
const fragment = renderToStaticMarkup(h(Guide, { built, channels, hours, buildMs }));

mkdirSync(join(OUT, "fragment"), { recursive: true });
writeFileSync(join(OUT, "fragment", "guide.html"), fragment);
writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>guide-ssg · standalone</title></head><body style="margin:0;padding:24px;background:#0b0b0b;color:#a3a3a3"><p style="font:12px ui-monospace,monospace;color:#6e6e6e">Remote <b>guide-ssg</b> corriendo solo. Recarga cuantas veces quieras: la hora no cambia hasta el próximo build.</p>${fragment}</body></html>`,
);
writeFileSync(join(OUT, "build.json"), JSON.stringify({ name: "guide-ssg", version: "1.0.7", builtAt: builtAt.toISOString(), buildMs, files: ["index.html", "fragment/guide.html"] }, null, 2));
console.log(`guide-ssg: 2 páginas generadas en ${buildMs} ms → dist/`);
