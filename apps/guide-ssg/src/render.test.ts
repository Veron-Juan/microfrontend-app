import assert from "node:assert/strict";
import { test } from "node:test";
import { renderGuideFragment, standalonePage } from "./render.tsx";
import type { Series } from "./series.ts";

const SERIES: Series = {
  id: 169,
  name: "Breaking Bad",
  status: "Ended",
  network: "AMC",
  image: "https://static.tvmaze.com/poster.jpg",
  genres: ["Drama", "Crime"],
  episodes: [
    {
      season: 1,
      number: 1,
      name: "Pilot",
      airdate: "2008-01-20",
      rating: 8.3,
      image: "https://static.tvmaze.com/pilot.jpg",
    },
    { season: 1, number: 2, name: "Cat's in the Bag...", airdate: "2008-01-27", rating: 7.9 },
    { season: 1, number: 3, name: "...and the Bag's in the River", airdate: "2008-02-10", rating: 8.1 },
    { season: 2, number: 1, name: "Seven Thirty-Seven", airdate: "2009-03-08", rating: 8.4 },
    { season: 2, number: 2, name: "Grilled", airdate: "2009-03-15", rating: null },
  ],
};

const html = renderGuideFragment(".x{}", {
  built: "19 oct a las 18:12:34",
  series: SERIES,
  buildMs: 12,
  source: { name: "TVmaze", url: "https://www.tvmaze.com/shows/169", detail: "pedidos una vez, en el build" },
});

test("el fragmento es autocontenido: <style> y luego la sección, sin <html> ni <body>", () => {
  assert.ok(html.startsWith("<style>.x{}</style><section"), html.slice(0, 60));
  assert.doesNotMatch(html, /<html|<body/);
});

test("el fragmento tiene una fila por temporada y una columna por episodio", () => {
  assert.match(html, /<h3[^>]*>Guía de episodios<\/h3>/);
  assert.match(html, /<b[^>]*>Breaking Bad<\/b>/);
  assert.ok(html.includes("19 oct a las 18:12:34"));
  assert.ok(html.includes("AMC · 2008–2009"));
  const head = html.match(/<thead>.*<\/thead>/)?.[0] ?? "";
  // La columna de la temporada, una por episodio y la de la media.
  assert.equal(head.match(/<th /g)?.length, 1 + 3 + 1);
  const rows = (html.match(/<tbody>.*<\/tbody>/)?.[0] ?? "").split("</tr>").slice(0, -1);
  assert.equal(rows.length, 2);
  // Las temporadas más cortas se completan con celdas vacías; la última celda es la media.
  for (const row of rows) assert.equal(row.match(/<td/g)?.length, 3 + 1);
  assert.match(rows[0], />8,1<\/td>$/);
  assert.ok(html.includes("generado en 12 ms"));
});

test("cada celda muestra la nota y, al pasar el mouse, el episodio; los textos van escapados", () => {
  assert.match(
    html,
    /<td [^>]*>7,9<span [^>]*><b [^>]*>T1 E2 · Cat&#x27;s in the Bag\.\.\.<\/b><span [^>]*>27 ene\.? 2008<\/span><\/span><\/td>/,
  );
  assert.match(html, /<td [^>]*>–<span [^>]*><b [^>]*>T2 E2 · Grilled<\/b>/);
  // La primera fila abre el recuadro hacia abajo, para que no se corte; las demás, hacia arriba.
  const rows = (html.match(/<tbody>.*<\/tbody>/)?.[0] ?? "").split("</tr>");
  assert.match(rows[0], /gde:top-\[calc\(100%\+6px\)\]/);
  assert.match(rows[1], /gde:bottom-\[calc\(100%\+6px\)\]/);
});

test("la portada muestra la carátula, los géneros en español y las cifras de la serie", () => {
  assert.match(html, /<img src="https:\/\/static\.tvmaze\.com\/poster\.jpg" alt="Carátula de Breaking Bad"/);
  assert.ok(html.includes("AMC · 2008–2009 · Drama · Crimen"));
  assert.ok(html.includes("terminada: estos datos ya no cambian"));
  // Nota media de los episodios con nota: (8,3 + 7,9 + 8,1 + 8,4) / 4.
  assert.match(html, /<dt [^>]*>nota media<\/dt><dd [^>]*><span [^>]*>★<\/span> 8,2<\/dd>/);
});

test("los mejores episodios van en orden, con su puesto, su nota y su captura si la hay", () => {
  const top = html.match(/<ol [^>]*>.*?<\/ol>/)?.[0] ?? "";
  const items = top.split("</li>").slice(0, -1);
  assert.equal(items.length, 3);
  assert.match(items[0], /Seven Thirty-Seven/);
  assert.match(items[0], />1<\/span>/);
  assert.match(items[0], /★<\/span> 8,4/);
  assert.match(items[1], /<img src="https:\/\/static\.tvmaze\.com\/pilot\.jpg"/);
  assert.match(items[1], /T1 E1 · 20 ene\.? 2008/);
  assert.match(items[2], /T1 E3/);
});

test("el pie da crédito a la fuente de los datos con un enlace", () => {
  assert.match(html, /<a href="https:\/\/www\.tvmaze\.com\/shows\/169"[^>]*>TVmaze<\/a>/);
  assert.ok(html.includes("pedidos una vez, en el build"));
});

test("todas las clases llevan el prefijo del remote", () => {
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" ").filter(Boolean));
  assert.ok(classes.length > 0);
  for (const name of classes) assert.ok(name.startsWith("gde:"), `clase sin prefijo: ${name}`);
});

test("standalonePage envuelve el fragmento en una página con tema claro", () => {
  const page = standalonePage("<section>hola</section>", "body{}");
  assert.match(page, /^<!doctype html><html lang="es" data-theme="light">/);
  assert.ok(page.includes("<style>body{}</style>"));
  assert.ok(page.includes("<section>hola</section></body></html>"));
});
