import assert from "node:assert/strict";
import { test } from "node:test";
import { liveDataAt } from "./live-data.ts";
import { formatRenderedAt, renderFragment, standalonePage } from "./render.tsx";

const NOW = Date.UTC(2026, 9, 19, 19, 28, 15, 538);

const render = () =>
  renderFragment({
    css: ".x{color:red}",
    served: 7,
    fetchData: async (now) => liveDataAt(now),
    now: () => NOW,
    newRequestId: () => "abcd1234",
  });

test("formatRenderedAt incluye los milisegundos", () => {
  assert.match(formatRenderedAt(NOW), /^\d{1,2}:\d{2}:\d{2}\.538$/);
});

test("renderFragment devuelve un fragmento autocontenido: <style> y luego la sección", async () => {
  const { html, now, requestId } = await render();
  assert.equal(now, NOW);
  assert.equal(requestId, "abcd1234");
  assert.ok(html.startsWith("<style>.x{color:red}</style><section"), html.slice(0, 60));
  assert.doesNotMatch(html, /<html|<body/);
});

test("el fragmento tiene la estructura de News: marcadores, titulares y pie", async () => {
  const { html } = await render();
  const data = liveDataAt(NOW);
  assert.match(html, /data-request="abcd1234"/);
  assert.match(html, /<h3[^>]*>Novedades en vivo<\/h3>/);
  assert.equal(html.match(/<ul[^>]*>.*<\/ul>/)?.[0].match(/<li /g)?.length, data.scores.length);
  assert.equal(html.match(/<ol[^>]*>.*<\/ol>/)?.[0].match(/<li /g)?.length, data.headlines.length);
  for (const line of data.headlines) assert.ok(html.includes(line));
  assert.match(html, /request nº <!-- -->7<!-- --> de este servidor/);
  // Todas las clases llevan el prefijo del remote.
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" "));
  assert.ok(classes.length > 0);
  for (const name of classes) assert.ok(name.startsWith("nws:"), `clase sin prefijo: ${name}`);
});

test("standalonePage envuelve el fragmento en una página con tema oscuro", () => {
  const page = standalonePage("<section>hola</section>", "body{}");
  assert.match(page, /^<!doctype html><html lang="es" data-theme="dark">/);
  assert.ok(page.includes("<style>body{}</style>"));
  assert.ok(page.includes("<section>hola</section></body></html>"));
});
