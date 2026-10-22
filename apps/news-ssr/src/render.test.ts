import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_DATA } from "./fixtures.ts";
import type { LiveData } from "./live-data.ts";
import { formatKickoff, formatRenderedAt, renderFragment, standalonePage } from "./render.tsx";

const NOW = Date.UTC(2026, 9, 19, 19, 28, 15, 538);

const render = (data: LiveData = SAMPLE_DATA) =>
  renderFragment({
    css: ".x{color:red}",
    served: 7,
    fetchData: async () => data,
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

test("formatKickoff muestra horas y minutos", () => {
  assert.match(formatKickoff("2026-10-21T22:30:00.000Z"), /^\d{2}:\d{2}$/);
});

test("el fragmento tiene la estructura de News: partidos, novedades, créditos y pie", async () => {
  const { html } = await render();
  assert.match(html, /data-request="abcd1234"/);
  assert.match(html, /<h3[^>]*>Novedades en vivo<\/h3>/);
  assert.equal(html.match(/<ul[^>]*>.*<\/ul>/)?.[0].match(/<li /g)?.length, SAMPLE_DATA.matches.items.length);
  assert.equal(html.match(/<ol[^>]*>.*<\/ol>/)?.[0].match(/<li /g)?.length, SAMPLE_DATA.premieres.items.length);
  // Los nombres vienen de una API externa: React los escapa antes de que el shell haga innerHTML.
  assert.ok(html.includes("The Terminal List"));
  assert.ok(html.includes("Where&#x27;s Wanda?"));
  assert.ok(html.includes("Ellie &amp; Natasia"));
  assert.ok(html.includes(">final<") && html.includes(">en vivo<"));
  // El partido en vivo lleva el punto que parpadea; los escudos y carátulas son <img> con su URL.
  assert.match(html, /nws:animate-live/);
  assert.ok(html.includes('<img src="https://r2.thesportsdb.com/images/media/team/badge/riestra.png/tiny"'));
  assert.ok(html.includes('<img src="https://static.tvmaze.com/10.jpg"'));
  assert.match(html, /<a href="https:\/\/www\.thesportsdb\.com"[^>]*>TheSportsDB<\/a>/);
  assert.match(html, /<a href="https:\/\/www\.tvmaze\.com"[^>]*>TVmaze<\/a>/);
  assert.match(html, /de hace 12 s/);
  assert.match(html, /request nº <!-- -->7<!-- --> de este servidor/);
  // Todas las clases llevan el prefijo del remote.
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" "));
  assert.ok(classes.length > 0);
  for (const name of classes) assert.ok(name.startsWith("nws:"), `clase sin prefijo: ${name}`);
});

test("si una fuente falló, su sección muestra un aviso y la otra se ve igual", async () => {
  const { html } = await render({ ...SAMPLE_DATA, matches: { items: [], ok: false, age: 0 } });
  assert.doesNotMatch(html, /<ul/);
  assert.match(html, /La fuente no respondió/);
  assert.match(html, /<ol/);
  assert.match(html, /sin respuesta/);
});

test("standalonePage envuelve el fragmento en una página con tema claro", () => {
  const page = standalonePage("<section>hola</section>", "body{}");
  assert.match(page, /^<!doctype html><html lang="es" data-theme="light">/);
  assert.ok(page.includes("<style>body{}</style>"));
  assert.ok(page.includes("<section>hola</section></body></html>"));
});
