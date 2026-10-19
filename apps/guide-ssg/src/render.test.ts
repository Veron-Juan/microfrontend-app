import assert from "node:assert/strict";
import { test } from "node:test";
import { renderGuideFragment, standalonePage } from "./render.tsx";
import { CHANNELS, HOURS } from "./schedule.ts";

const html = renderGuideFragment(".x{}", {
  built: "19 oct a las 18:12:34",
  channels: CHANNELS,
  hours: HOURS,
  buildMs: 12,
});

test("el fragmento es autocontenido: <style> y luego la sección, sin <html> ni <body>", () => {
  assert.ok(html.startsWith("<style>.x{}</style><section"), html.slice(0, 60));
  assert.doesNotMatch(html, /<html|<body/);
});

test("el fragmento tiene la estructura de Guide: una columna por hora y una fila por canal", () => {
  assert.match(html, /<h3[^>]*>Guía de programación<\/h3>/);
  assert.ok(html.includes("19 oct a las 18:12:34"));
  const head = html.match(/<thead>.*<\/thead>/)?.[0] ?? "";
  assert.equal(head.match(/<th /g)?.length, HOURS.length + 1);
  const body = html.match(/<tbody>.*<\/tbody>/)?.[0] ?? "";
  assert.equal(body.match(/<tr /g)?.length, CHANNELS.length);
  // Cada fila ocupa todas las horas, contando los colspan.
  for (const row of body.split("</tr>").slice(0, -1)) {
    const spans = [...row.matchAll(/colSpan="(\d+)"/gi)].map((match) => Number(match[1]));
    assert.equal(
      spans.reduce((sum, span) => sum + span, 0),
      HOURS.length,
    );
  }
  assert.ok(html.includes("generado en <!-- -->12<!-- --> ms") || html.includes("generado en 12 ms"));
});

test("todas las clases llevan el prefijo del remote", () => {
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" "));
  assert.ok(classes.length > 0);
  for (const name of classes) assert.ok(name.startsWith("gde:"), `clase sin prefijo: ${name}`);
});

test("standalonePage envuelve el fragmento en una página con tema oscuro", () => {
  const page = standalonePage("<section>hola</section>", "body{}");
  assert.match(page, /^<!doctype html><html lang="es" data-theme="dark">/);
  assert.ok(page.includes("<style>body{}</style>"));
  assert.ok(page.includes("<section>hola</section></body></html>"));
});
