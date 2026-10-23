import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp, type AppOptions } from "./app.ts";
import { SAMPLE_DATA } from "./fixtures.ts";

// Starts the app on a free port and returns its base URL.
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

test("GET /fragment/news responds with the fragment and the lesson's headers", async () => {
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

test("GET / returns the standalone page and /health counts the renders", async () => {
  const page = await fetch(`${base}/`).then((response) => response.text());
  assert.match(page, /<html lang="en" data-theme="light">/);
  const health = (await fetch(`${base}/health`).then((response) => response.json())) as { ok: boolean; served: number };
  assert.equal(health.ok, true);
  assert.ok(health.served >= 1);
});

test("an unknown route responds 404", async () => {
  const response = await fetch(`${base}/nothing`);
  assert.equal(response.status, 404);
});

test("if the data API fails, it responds 500 instead of leaving the request hanging", async (t) => {
  t.mock.method(console, "error", () => undefined);
  const broken = await listen({ fetchData: () => Promise.reject(new Error("API down")) });
  try {
    const response = await fetch(`${broken.base}/fragment/news`);
    assert.equal(response.status, 500);
  } finally {
    broken.server.close();
  }
});

test("every response carries the security headers", async () => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("over the limit it responds 429 without rendering, but /health keeps responding", async () => {
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
