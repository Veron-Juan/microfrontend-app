import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL, SHOWS, filterByKind, kindsOf } from "./shows.ts";

test("catalog ids are unique", () => {
  const ids = SHOWS.map((show) => show.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("kindsOf() starts with All and doesn't repeat kinds", () => {
  const shows = [SHOWS[0], SHOWS[1], { ...SHOWS[1], id: "d9" }];
  assert.deepEqual(kindsOf(shows), [ALL, "Sports", "Documentary"]);
});

test("filterByKind() with All returns the whole catalog", () => {
  assert.equal(filterByKind(SHOWS, ALL), SHOWS);
});

test("filterByKind() keeps only the titles of that kind", () => {
  const series = filterByKind(SHOWS, "Series");
  assert.deepEqual(
    series.map((show) => show.id),
    ["s3"],
  );
  assert.deepEqual(filterByKind(SHOWS, "Unknown"), []);
});
