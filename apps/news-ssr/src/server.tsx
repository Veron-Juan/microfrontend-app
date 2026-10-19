import express from "express";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { renderToString } from "react-dom/server";
import { News, type NewsProps, type Score } from "./News.tsx";

const PORT = Number(process.env.PORT ?? 5003);
const VERSION = "3.0.2";
const app = express();
let served = 0;

// CORS: el shell vive en otro origen y necesita leer también las cabeceras de diagnóstico.
app.use((_req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "X-Rendered-At, X-Request-Id, X-Render-Mode, X-App-Version, Server-Timing",
  });
  next();
});

const TEAMS: [home: string, away: string][] = [["Lima", "Quito"], ["Bogotá", "Caracas"], ["Santiago", "Montevideo"]];
const HEADLINES = [
  "Se confirma la transmisión en 4K de la final",
  "Nuevo documental sobre la cordillera llega el viernes",
  "El clásico del domingo rompe récord de audiencia",
  "Estrenos de la semana: tres series y una película",
  "Cambios en la grilla por la cobertura especial",
  "La selección anuncia su lista para el amistoso",
];

// Simula la consulta a una API de marcadores: datos que cambian en cada request.
async function fetchLiveData(now: number): Promise<Pick<NewsProps, "scores" | "headlines">> {
  await new Promise((done) => setTimeout(done, 30 + Math.random() * 50));
  const minute = Math.floor(now / 60000) % 90;
  const scores: Score[] = TEAMS.map(([home, away], index) => ({
    home,
    away,
    minute: (minute + index * 17) % 90 + 1,
    goals: [Math.floor(((now / 47000) + index) % 4), Math.floor(((now / 61000) + index * 2) % 3)],
  }));
  const start = Math.floor(now / 10000) % HEADLINES.length;
  const headlines = [0, 1, 2].map((offset) => HEADLINES[(start + offset) % HEADLINES.length]);
  return { scores, headlines };
}

async function renderFragment() {
  const t0 = performance.now();
  const now = Date.now();
  const data = await fetchLiveData(now);
  const t1 = performance.now();
  const requestId = randomUUID().slice(0, 8);
  served += 1;
  const timing = { data: Math.round(t1 - t0), render: 0 };
  const rendered = new Date(now).toLocaleTimeString("es", { hour12: false }) + "." + String(now % 1000).padStart(3, "0");
  const html = renderToString(<News rendered={rendered} requestId={requestId} served={served} timing={timing} {...data} />);
  timing.render = Math.round((performance.now() - t1) * 10) / 10;
  return { html, now, requestId, timing };
}

// El fragmento: HTML sin <html> ni <body>, listo para incrustarse en el shell.
app.get("/fragment/news", async (_req, res) => {
  const { html, now, requestId, timing } = await renderFragment();
  res.set({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Render-Mode": "SSR",
    "X-App-Version": VERSION,
    "X-Rendered-At": new Date(now).toISOString(),
    "X-Request-Id": requestId,
    "Server-Timing": `data;dur=${timing.data}, render;dur=${timing.render}`,
  });
  res.send(html);
});

// La misma app vista sola, como página completa.
app.get("/", async (_req, res) => {
  const { html } = await renderFragment();
  res.type("html").send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>news-ssr · standalone</title></head><body style="margin:0;padding:24px;background:#0b0b0b;color:#a3a3a3"><p style="font:12px ui-monospace,monospace;color:#6e6e6e">Remote <b>news-ssr</b> corriendo solo. Recarga y verás otra hora y otro id: cada request se renderiza de nuevo.</p>${html}</body></html>`);
});

app.get("/health", (_req, res) => res.json({ ok: true, name: "news-ssr", version: VERSION, served }));

app.listen(PORT, () => console.log(`news-ssr (SSR) escuchando en http://localhost:${PORT}`));
