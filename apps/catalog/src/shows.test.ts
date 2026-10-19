import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL, SHOWS, filterByKind, kindsOf } from "./shows.ts";

test("los ids del catálogo son únicos", () => {
  const ids = SHOWS.map((show) => show.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("kindsOf() empieza con Todo y no repite tipos", () => {
  const shows = [SHOWS[0], SHOWS[1], { ...SHOWS[1], id: "d9" }];
  assert.deepEqual(kindsOf(shows), [ALL, "Deportes", "Documental"]);
});

test("filterByKind() con Todo devuelve todo el catálogo", () => {
  assert.equal(filterByKind(SHOWS, ALL), SHOWS);
});

test("filterByKind() deja solo los títulos de ese tipo", () => {
  const series = filterByKind(SHOWS, "Serie");
  assert.deepEqual(
    series.map((show) => show.id),
    ["s3"],
  );
  assert.deepEqual(filterByKind(SHOWS, "Desconocido"), []);
});
