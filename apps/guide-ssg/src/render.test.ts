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
  built: "19 Oct at 18:12:34",
  series: SERIES,
  buildMs: 12,
  source: { name: "TVmaze", url: "https://www.tvmaze.com/shows/169", detail: "fetched once, at build time" },
});

test("the fragment is self-contained: <style> and then the section, with no <html> or <body>", () => {
  assert.ok(html.startsWith("<style>.x{}</style><section"), html.slice(0, 60));
  assert.doesNotMatch(html, /<html|<body/);
});

test("the fragment has one row per season and one column per episode", () => {
  assert.match(html, /<h3[^>]*>Episode guide<\/h3>/);
  assert.match(html, /<b[^>]*>Breaking Bad<\/b>/);
  assert.ok(html.includes("19 Oct at 18:12:34"));
  assert.ok(html.includes("AMC · 2008–2009"));
  const head = html.match(/<thead>.*<\/thead>/)?.[0] ?? "";
  // The season column, one per episode and the average one.
  assert.equal(head.match(/<th /g)?.length, 1 + 3 + 1);
  const rows = (html.match(/<tbody>.*<\/tbody>/)?.[0] ?? "").split("</tr>").slice(0, -1);
  assert.equal(rows.length, 2);
  // Shorter seasons are padded with empty cells; the last cell is the average.
  for (const row of rows) assert.equal(row.match(/<td/g)?.length, 3 + 1);
  assert.match(rows[0], />8.1<\/td>$/);
  assert.ok(html.includes("generated in 12 ms"));
});

test("each cell shows the rating and, on hover, the episode; the texts are escaped", () => {
  assert.match(
    html,
    /<td [^>]*>7\.9<span [^>]*><b [^>]*>S1 E2 · Cat&#x27;s in the Bag\.\.\.<\/b><span [^>]*>27 Jan 2008<\/span><\/span><\/td>/,
  );
  assert.match(html, /<td [^>]*>–<span [^>]*><b [^>]*>S2 E2 · Grilled<\/b>/);
  // The first row opens the tooltip downwards, so it isn't cut off; the rest, upwards.
  const rows = (html.match(/<tbody>.*<\/tbody>/)?.[0] ?? "").split("</tr>");
  assert.match(rows[0], /gde:top-\[calc\(100%\+6px\)\]/);
  assert.match(rows[1], /gde:bottom-\[calc\(100%\+6px\)\]/);
});

test("the hero shows the poster, the genres and the show's figures", () => {
  assert.match(html, /<img src="https:\/\/static\.tvmaze\.com\/poster\.jpg" alt="Poster for Breaking Bad"/);
  assert.ok(html.includes("AMC · 2008–2009 · Drama · Crime"));
  assert.ok(html.includes("ended: this data no longer changes"));
  // Average rating of the rated episodes: (8.3 + 7.9 + 8.1 + 8.4) / 4.
  assert.match(html, /<dt [^>]*>avg rating<\/dt><dd [^>]*><span [^>]*>★<\/span> 8\.2<\/dd>/);
});

test("the top episodes go in order, with their rank, rating and still if there is one", () => {
  const top = html.match(/<ol [^>]*>.*?<\/ol>/)?.[0] ?? "";
  const items = top.split("</li>").slice(0, -1);
  assert.equal(items.length, 3);
  assert.match(items[0], /Seven Thirty-Seven/);
  assert.match(items[0], />1<\/span>/);
  assert.match(items[0], /★<\/span> 8\.4/);
  assert.match(items[1], /<img src="https:\/\/static\.tvmaze\.com\/pilot\.jpg"/);
  assert.match(items[1], /S1 E1 · 20 Jan 2008/);
  assert.match(items[2], /S1 E3/);
});

test("the footer credits the data source with a link", () => {
  assert.match(html, /<a href="https:\/\/www\.tvmaze\.com\/shows\/169"[^>]*>TVmaze<\/a>/);
  assert.ok(html.includes("fetched once, at build time"));
});

test("every class carries the remote's prefix", () => {
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" ").filter(Boolean));
  assert.ok(classes.length > 0);
  for (const name of classes) assert.ok(name.startsWith("gde:"), `class without prefix: ${name}`);
});

test("standalonePage wraps the fragment in a page with the light theme", () => {
  const page = standalonePage("<section>hello</section>", "body{}");
  assert.match(page, /^<!doctype html><html lang="en" data-theme="light">/);
  assert.ok(page.includes("<style>body{}</style>"));
  assert.ok(page.includes("<section>hello</section></body></html>"));
});
