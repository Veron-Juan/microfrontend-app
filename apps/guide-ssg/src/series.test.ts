import assert from "node:assert/strict";
import { test } from "node:test";
import {
  averageRating,
  bestEpisode,
  formatAirdate,
  formatBuiltAt,
  formatRating,
  genreLabel,
  topEpisodes,
  ratingLevel,
  ratingRange,
  RATING_LEVELS,
  seasonsOf,
  seriesProblems,
  type Episode,
  type Series,
} from "./series.ts";
import snapshot from "./snapshot.json" with { type: "json" };

const episode = (season: number, number: number, rating: number | null = 8, name = `E${number}`): Episode => ({
  season,
  number,
  name,
  airdate: `${2000 + season}-01-0${number}`,
  rating,
});

const series = (episodes: Episode[], status = "Ended"): Series => ({
  id: 1,
  name: "Prueba",
  status,
  network: "AMC",
  episodes,
});

test("la copia guardada en el repo sirve para la guía", () => {
  assert.deepEqual(seriesProblems(snapshot), []);
});

test("seasonsOf agrupa por temporada y ordena los episodios", () => {
  const seasons = seasonsOf([episode(2, 2), episode(1, 1), episode(2, 1)]);
  assert.deepEqual(
    seasons.map((season) => [season.number, season.year, season.episodes.map((e) => e.number)]),
    [
      [1, "2001", [1]],
      [2, "2002", [1, 2]],
    ],
  );
});

test("ratingLevel reparte las notas de la serie entre los tonos", () => {
  const range = ratingRange([episode(1, 1, 7), episode(1, 2, null), episode(1, 3, 9)]);
  assert.deepEqual(range, { min: 7, max: 9 });
  assert.equal(ratingLevel(7, range), 0);
  assert.equal(ratingLevel(8, range), 2);
  assert.equal(ratingLevel(9, range), RATING_LEVELS - 1);
  assert.equal(ratingLevel(null, range), null);
  assert.equal(ratingRange([episode(1, 1, null)]), null);
  assert.equal(ratingLevel(8, { min: 8, max: 8 }), RATING_LEVELS - 1);
});

test("averageRating promedia solo los episodios con nota", () => {
  assert.equal(averageRating([episode(1, 1, 8), episode(1, 2, null), episode(1, 3, 9)]), 8.5);
  assert.equal(averageRating([episode(1, 1, null)]), null);
});

test("topEpisodes ordena por nota, desempata por orden de salida y salta los que no tienen nota", () => {
  const top = topEpisodes(
    [
      episode(1, 1, 8, "A"),
      episode(1, 2, 9, "B"),
      episode(2, 1, null, "C"),
      episode(2, 2, 9, "D"),
      episode(2, 3, 7, "E"),
    ],
    3,
  );
  assert.deepEqual(
    top.map((e) => e.name),
    ["B", "D", "A"],
  );
});

test("genreLabel traduce los géneros conocidos y deja pasar los demás", () => {
  assert.equal(genreLabel("Crime"), "Crimen");
  assert.equal(genreLabel("Anime"), "Anime");
});

test("bestEpisode elige la mejor nota y, si empatan, la primera", () => {
  const best = bestEpisode([episode(1, 1, 8, "A"), episode(1, 2, 9, "B"), episode(2, 1, 9, "C"), episode(2, 2, null)]);
  assert.equal(best?.name, "B");
  assert.equal(bestEpisode([episode(1, 1, null)]), null);
});

test("seriesProblems rechaza una serie que sigue en emisión: la guía quedaría vieja", () => {
  assert.deepEqual(seriesProblems(series([episode(1, 1)])), []);
  assert.deepEqual(seriesProblems(series([episode(1, 1)], "Running")), [
    'Prueba sigue en emisión ("Running"): sus datos cambian y la guía quedaría vieja',
  ]);
});

test("seriesProblems detecta temporadas con huecos y series vacías", () => {
  assert.deepEqual(seriesProblems(series([episode(1, 1), episode(1, 3)])), ["T1: los episodios no van del 1 al 2"]);
  assert.deepEqual(seriesProblems(series([])), ["Prueba no tiene episodios"]);
});

test("las notas y las fechas se muestran en español", () => {
  assert.equal(formatRating(8), "8,0");
  assert.equal(formatRating(9.25), "9,3");
  assert.match(formatAirdate("2008-01-20"), /^20 ene\.? 2008$/);
  assert.equal(formatAirdate(""), "sin fecha");
  assert.match(formatBuiltAt(new Date(2026, 9, 19, 18, 12, 34)), /^19 oct\.? a las 18:12:34$/);
});
