/** @jsxRuntime automatic */
// Arma el fragmento y la página standalone. No sabe nada de Express: recibe todo lo que necesita.
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { renderToString } from "react-dom/server";
import type { LiveData } from "./live-data.ts";
import { News } from "./News.tsx";

export interface RenderOptions {
  /** CSS compilado del fragmento; viaja dentro del propio HTML. */
  css: string;
  /** Número de request de este servidor, para mostrarlo en el pie. */
  served: number;
  fetchData: (now: number) => Promise<LiveData>;
  now?: () => number;
  newRequestId?: () => string;
}

export interface RenderedFragment {
  html: string;
  now: number;
  requestId: string;
  timing: { data: number; render: number };
}

/** La hora del render con milisegundos, p. ej. "19:28:15.538". */
export function formatRenderedAt(now: number): string {
  const time = new Date(now).toLocaleTimeString("es", { hour12: false });
  return `${time}.${String(now % 1000).padStart(3, "0")}`;
}

const shortId = () => randomUUID().slice(0, 8);

export async function renderFragment({
  css,
  served,
  fetchData,
  now: clock = Date.now,
  newRequestId = shortId,
}: RenderOptions): Promise<RenderedFragment> {
  const t0 = performance.now();
  const now = clock();
  const data = await fetchData(now);
  const t1 = performance.now();
  const requestId = newRequestId();
  const timing = { data: Math.round(t1 - t0), render: 0 };
  const markup = renderToString(
    <News rendered={formatRenderedAt(now)} requestId={requestId} served={served} timing={timing} {...data} />,
  );
  timing.render = Math.round((performance.now() - t1) * 10) / 10;
  // El shell inserta el fragmento con innerHTML: el <style> va adentro para que llegue completo,
  // sin pedir otra hoja. Se concatena fuera de React porque React escaparía caracteres como ">".
  return { html: `<style>${css}</style>${markup}`, now, requestId, timing };
}

/** La misma app vista sola, como página completa (con las fuentes que en producción carga el shell). */
export function standalonePage(fragment: string, css: string): string {
  return `<!doctype html><html lang="es" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>news-ssr · standalone</title><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>${css}</style></head><body><p>Remote <b>news-ssr</b> corriendo solo. Recarga y verás otra hora y otro id: cada request se renderiza de nuevo.</p>${fragment}</body></html>`;
}
