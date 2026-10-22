import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { contentTypeOf, createStaticHandler, etagOf, headersFile, isNotModified, resolveFile } from "./static.ts";

const ROOT = join(tmpdir(), "dist");

test("resolveFile sirve index.html en la raíz y resuelve rutas dentro de dist", () => {
  assert.equal(resolveFile(ROOT, "/"), join(ROOT, "index.html"));
  assert.equal(resolveFile(ROOT, "/fragment/guide.html"), join(ROOT, "fragment", "guide.html"));
  assert.equal(resolveFile(ROOT, "/fragment/"), join(ROOT, "fragment", "index.html"));
  assert.equal(resolveFile(ROOT, "/con%20espacio.html"), join(ROOT, "con espacio.html"));
});

test("resolveFile rechaza rutas que intentan salir de dist", () => {
  for (const path of [
    "/../secret.txt",
    "/fragment/../../x",
    "/..%2Fpackage.json",
    "/%2e%2e/%2e%2e/etc/passwd",
    "/../dist2/x",
  ]) {
    assert.equal(resolveFile(ROOT, path), null, path);
  }
});

test("resolveFile rechaza rutas mal codificadas o con bytes nulos", () => {
  assert.equal(resolveFile(ROOT, "/%E0%A4%A"), null);
  assert.equal(resolveFile(ROOT, "/index.html%00.json"), null);
});

test("contentTypeOf conoce html y json, y usa binario para lo demás", () => {
  assert.equal(contentTypeOf("a/index.html"), "text/html; charset=utf-8");
  assert.equal(contentTypeOf("build.json"), "application/json");
  assert.equal(contentTypeOf("logo.xyz"), "application/octet-stream");
});

test("etagOf depende solo del contenido", () => {
  const tag = etagOf(Buffer.from("hola"));
  assert.match(tag, /^"[0-9a-f]{12}"$/);
  assert.equal(etagOf(Buffer.from("hola")), tag);
  assert.notEqual(etagOf(Buffer.from("chau")), tag);
});

test("isNotModified compara If-None-Match, con listas, W/ y *", () => {
  assert.equal(isNotModified(undefined, '"a"'), false);
  assert.equal(isNotModified('"a"', '"a"'), true);
  assert.equal(isNotModified('"b", W/"a"', '"a"'), true);
  assert.equal(isNotModified("*", '"a"'), true);
  assert.equal(isNotModified('"b"', '"a"'), false);
});

test("headersFile genera el _headers del CDN con las mismas cabeceras y sin valores vacíos", () => {
  const file = headersFile({ builtAt: "2026-10-19T18:12:34.000Z" });
  const lines = file.split("\n");
  assert.equal(lines[0], "/*");
  assert.ok(lines.includes("  X-Render-Mode: SSG"));
  assert.ok(lines.includes("  X-Built-At: 2026-10-19T18:12:34.000Z"));
  assert.ok(lines.includes("  Access-Control-Allow-Origin: *"));
  assert.ok(lines.some((line) => line.startsWith("  Cache-Control: public, max-age=300")));
  assert.ok(!lines.some((line) => line.startsWith("  X-App-Version:")));
});

// El handler completo, sobre una carpeta temporal con un build falso.
let dir: string;
let server: Server;
let base: string;

before(async () => {
  dir = await mkdtemp(join(tmpdir(), "guide-ssg-"));
  await mkdir(join(dir, "fragment"));
  await writeFile(join(dir, "fragment", "guide.html"), "<section>guía</section>");
  server = createServer(createStaticHandler(dir, { builtAt: "2026-10-19T18:12:34.000Z", version: "1.2.3" }));
  await new Promise<void>((done) => server.listen(0, done));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  server.close();
  await rm(dir, { recursive: true, force: true });
});

test("el handler sirve el fragmento con cabeceras de CDN y responde 304 si no cambió", async () => {
  const response = await fetch(`${base}/fragment/guide.html`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "<section>guía</section>");
  assert.equal(response.headers.get("x-render-mode"), "SSG");
  assert.equal(response.headers.get("x-built-at"), "2026-10-19T18:12:34.000Z");
  assert.equal(response.headers.get("x-app-version"), "1.2.3");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300, stale-while-revalidate=86400");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("timing-allow-origin"), "*");
  // Age es el tiempo en la caché de un CDN: el origen no la envía.
  assert.equal(response.headers.get("age"), null);
  const etag = response.headers.get("etag") ?? "";
  assert.match(etag, /^"[0-9a-f]{12}"$/);

  const again = await fetch(`${base}/fragment/guide.html`, { headers: { "If-None-Match": etag } });
  assert.equal(again.status, 304);
});

test("el handler responde 404 a lo que no existe y 405 a métodos que no son de lectura", async () => {
  assert.equal((await fetch(`${base}/nada.html`)).status, 404);
  assert.equal((await fetch(`${base}/..%2F..%2Fetc%2Fpasswd`)).status, 404);
  assert.equal((await fetch(`${base}/fragment/guide.html`, { method: "POST" })).status, 405);
});
