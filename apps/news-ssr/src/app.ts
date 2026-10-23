// The Express app: routes and headers. It's created with its dependencies so it can be tested.
import express, { type Express, type RequestHandler } from "express";
import { asyncHandler, errorHandler, notFound } from "./http.ts";
import type { LiveData } from "./live-data.ts";
import { renderFragment, standalonePage } from "./render.tsx";

export interface AppOptions {
  version: string;
  /** The fragment's CSS (`nws:` utilities). */
  css: string;
  /** Extra CSS for the standalone page (reset and background). */
  standaloneCss: string;
  /** Where each render's data comes from: the real APIs or, in the tests, fixed data. */
  fetchData: (now: number) => Promise<LiveData>;
  /** Takes a token from the usage limit and says how many seconds to wait (0: it can go through). Without it, there's no limit. */
  limit?: () => number;
}

export function createApp({ version, css, standaloneCss, fetchData, limit = () => 0 }: AppOptions): Express {
  const app = express();
  let served = 0;
  const render = () => renderFragment({ css, served: ++served, fetchData });

  app.disable("x-powered-by");

  // CORS: the shell lives on another origin and also needs to read the diagnostic headers.
  app.use((_req, res, next) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "X-Rendered-At, X-Request-Id, X-Render-Mode, X-App-Version, Server-Timing",
      // The browser doesn't guess types, doesn't send the origin URL to third parties and nobody can frame the page.
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
    });
    next();
  });

  // Whatever renders goes through the usage limit; /health doesn't, because Render polls it often.
  const limited: RequestHandler = (_req, res, next) => {
    const wait = limit();
    if (wait === 0) {
      next();
      return;
    }
    res
      .status(429)
      .set({ "Retry-After": String(wait), "Cache-Control": "no-store" })
      .type("text")
      .send("too many requests: try again later");
  };

  // The fragment: HTML with no <html> or <body>, ready to be embedded in the shell.
  app.get(
    "/fragment/news",
    limited,
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

  // The same app on its own, as a full page.
  app.get(
    "/",
    limited,
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
