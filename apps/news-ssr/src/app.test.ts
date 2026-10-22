import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp, type AppOptions } from "./app.ts";
import { SAMPLE_DATA } from "./fixtures.ts";

// Levanta la app en un puerto libre y devuelve su URL base.
async function listen(options: Partial<AppOptions> = {}): Promise<{ server: Server; base: string }> {
  const app = createApp({
    version: "9.9.9",
    css: ".x{}",
    standaloneCss: "body{}",
    fetchData: async () => SAMPLE_DATA,
    ...options,
  });
  const server = await new Promise<Server>((done) => {
    const started = app.listen(0, () => done(started));
  });
  return { server, base: `http://localhost:${(server.address() as AddressInfo).port}` };
}

let server: Server;
let base: string;
before(async () => ({ server, base } = await listen()));
after(() => server.close());

test("GET /fragment/news responde el fragmento con las cabeceras de la lección", async () => {
  const response = await fetch(`${base}/fragment/news`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-render-mode"), "SSR");
  assert.equal(response.headers.get("x-app-version"), "9.9.9");
  assert.match(response.headers.get("x-request-id") ?? "", /^[0-9a-f]{8}$/);
  assert.ok(!Number.isNaN(Date.parse(response.headers.get("x-rendered-at") ?? "")));
  assert.match(response.headers.get("server-timing") ?? "", /^data;dur=\d+, render;dur=[\d.]+$/);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-expose-headers") ?? "", /X-Request-Id/);
  assert.match(await response.text(), /^<style>\.x\{\}<\/style><section/);
});

test("GET / devuelve la página standalone y /health cuenta los renders", async () => {
  const page = await fetch(`${base}/`).then((response) => response.text());
  assert.match(page, /<html lang="es" data-theme="light">/);
  const health = (await fetch(`${base}/health`).then((response) => response.json())) as { ok: boolean; served: number };
  assert.equal(health.ok, true);
  assert.ok(health.served >= 1);
});

test("una ruta desconocida responde 404", async () => {
  const response = await fetch(`${base}/nada`);
  assert.equal(response.status, 404);
});

test("si la API de datos falla, responde 500 en vez de dejar la request colgada", async (t) => {
  t.mock.method(console, "error", () => undefined);
  const broken = await listen({ fetchData: () => Promise.reject(new Error("API caída")) });
  try {
    const response = await fetch(`${broken.base}/fragment/news`);
    assert.equal(response.status, 500);
  } finally {
    broken.server.close();
  }
});

test("cada respuesta lleva las cabeceras de seguridad", async () => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("si se pasó del límite responde 429 sin renderizar, pero /health sigue respondiendo", async () => {
  let renders = 0;
  const limitedApp = await listen({
    limit: () => 42,
    fetchData: async () => {
      renders += 1;
      return SAMPLE_DATA;
    },
  });
  try {
    for (const path of ["/fragment/news", "/"]) {
      const response = await fetch(`${limitedApp.base}${path}`);
      assert.equal(response.status, 429);
      assert.equal(response.headers.get("retry-after"), "42");
      assert.equal(response.headers.get("access-control-allow-origin"), "*");
    }
    assert.equal(renders, 0);
    assert.equal((await fetch(`${limitedApp.base}/health`)).status, 200);
  } finally {
    limitedApp.server.close();
  }
});
