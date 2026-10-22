import assert from "node:assert/strict";
import { test } from "node:test";
import { popularShows, searchResults, toShow } from "./tvmaze.ts";

const tvmazeShow = (id: number, name: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name,
  type: "Scripted",
  genres: ["Drama", "Crime"],
  averageRuntime: 60,
  runtime: 60,
  weight: 50,
  image: { medium: `https://static.tvmaze.com/uploads/images/medium_portrait/0/${id}.jpg` },
  ...overrides,
});

test("toShow traduce el género, pasa la duración a segundos y conserva la carátula", () => {
  assert.deepEqual(toShow(tvmazeShow(169, "Breaking Bad")), {
    id: "tvmaze-169",
    title: "Breaking Bad",
    kind: "Drama",
    length: 3600,
    hue: (169 * 47) % 360,
    tvmazeId: 169,
    image: "https://static.tvmaze.com/uploads/images/medium_portrait/0/169.jpg",
  });
});

test("toShow usa el formato si no hay géneros y valores por defecto si faltan datos", () => {
  const show = toShow(
    tvmazeShow(1, "Noticiero", { genres: [], type: "News", averageRuntime: null, runtime: null, image: null }),
  );
  assert.equal(show?.kind, "Noticias");
  assert.equal(show?.length, 1800);
  assert.equal(show?.image, undefined);
  assert.equal(toShow(tvmazeShow(2, "Raro", { genres: ["Kaiju"] }))?.kind, "Kaiju");
});

test("toShow descarta programas sin id o nombre e imágenes que no son https", () => {
  assert.equal(toShow({ name: "Sin id" }), null);
  assert.equal(toShow(null), null);
  assert.equal(toShow(tvmazeShow(3, "Http", { image: { medium: "http://x/y.jpg" } }))?.image, undefined);
});

test("popularShows ordena por popularidad y se queda con los primeros", () => {
  const shows = popularShows(
    [
      tvmazeShow(1, "Poco", { weight: 10 }),
      tvmazeShow(2, "Mucho", { weight: 99 }),
      { roto: true },
      tvmazeShow(3, "Medio", { weight: 50 }),
    ],
    2,
  );
  assert.deepEqual(
    shows.map((show) => show.title),
    ["Mucho", "Medio"],
  );
  assert.throws(() => popularShows({}), /lista de programas/);
});

test("searchResults respeta el orden de relevancia de TVmaze", () => {
  const shows = searchResults([
    { score: 0.9, show: tvmazeShow(10, "Star Trek") },
    { score: 0.5, show: tvmazeShow(11, "Lone Star") },
    { score: 0.1 },
  ]);
  assert.deepEqual(
    shows.map((show) => show.title),
    ["Star Trek", "Lone Star"],
  );
  assert.throws(() => searchResults(null), /lista de resultados/);
});
