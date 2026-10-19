// La app de Express: rutas y cabeceras. Se crea con sus dependencias para poder probarla.
import express, { type Express } from "express";
import { asyncHandler, errorHandler, notFound } from "./http.ts";
import { fetchLiveData, type LiveData } from "./live-data.ts";
import { renderFragment, standalonePage } from "./render.tsx";

export interface AppOptions {
  version: string;
  /** CSS del fragmento (utilidades `nws:`). */
  css: string;
  /** CSS extra de la página standalone (reset y fondo). */
  standaloneCss: string;
  fetchData?: (now: number) => Promise<LiveData>;
}

export function createApp({ version, css, standaloneCss, fetchData = fetchLiveData }: AppOptions): Express {
  const app = express();
  let served = 0;
  const render = () => renderFragment({ css, served: ++served, fetchData });

  app.disable("x-powered-by");

  // CORS: el shell vive en otro origen y necesita leer también las cabeceras de diagnóstico.
  app.use((_req, res, next) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "X-Rendered-At, X-Request-Id, X-Render-Mode, X-App-Version, Server-Timing",
    });
    next();
  });

  // El fragmento: HTML sin <html> ni <body>, listo para incrustarse en el shell.
  app.get(
    "/fragment/news",
    asyncHandler(async (_req, res) => {
      const { html, now, requestId, timing } = await render();
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Render-Mode": "SSR",
        "X-App-Version": version,
        "X-Rendered-At": new Date(now).toISOString(),
        "X-Request-Id": requestId,
        "Server-Timing": `data;dur=${timing.data}, render;dur=${timing.render}`,
      });
      res.send(html);
    }),
  );

  // La misma app vista sola, como página completa.
  app.get(
    "/",
    asyncHandler(async (_req, res) => {
      const { html } = await render();
      res.set("Cache-Control", "no-store").type("html").send(standalonePage(html, standaloneCss));
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, name: "news-ssr", version, served });
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
