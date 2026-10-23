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
  name: "Test",
  status,
  network: "AMC",
  episodes,
});

test("the copy stored in the repo is suitable for the guide", () => {
  assert.deepEqual(seriesProblems(snapshot), []);
});

test("seasonsOf groups by season and sorts the episodes", () => {
  const seasons = seasonsOf([episode(2, 2), episode(1, 1), episode(2, 1)]);
  assert.deepEqual(
    seasons.map((season) => [season.number, season.year, season.episodes.map((e) => e.number)]),
    [
      [1, "2001", [1]],
      [2, "2002", [1, 2]],
    ],
  );
});

test("ratingLevel spreads the show's ratings across the shades", () => {
  const range = ratingRange([episode(1, 1, 7), episode(1, 2, null), episode(1, 3, 9)]);
  assert.deepEqual(range, { min: 7, max: 9 });
  assert.equal(ratingLevel(7, range), 0);
  assert.equal(ratingLevel(8, range), 2);
  assert.equal(ratingLevel(9, range), RATING_LEVELS - 1);
  assert.equal(ratingLevel(null, range), null);
  assert.equal(ratingRange([episode(1, 1, null)]), null);
  assert.equal(ratingLevel(8, { min: 8, max: 8 }), RATING_LEVELS - 1);
});

test("averageRating averages only the rated episodes", () => {
  assert.equal(averageRating([episode(1, 1, 8), episode(1, 2, null), episode(1, 3, 9)]), 8.5);
  assert.equal(averageRating([episode(1, 1, null)]), null);
});

test("topEpisodes sorts by rating, breaks ties by air order and skips unrated ones", () => {
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

test("genreLabel relabels known genres and passes the rest through", () => {
  assert.equal(genreLabel("Science-Fiction"), "Sci-Fi");
  assert.equal(genreLabel("Anime"), "Anime");
});

test("bestEpisode picks the best rating and, on a tie, the first one", () => {
  const best = bestEpisode([episode(1, 1, 8, "A"), episode(1, 2, 9, "B"), episode(2, 1, 9, "C"), episode(2, 2, null)]);
  assert.equal(best?.name, "B");
  assert.equal(bestEpisode([episode(1, 1, null)]), null);
});

test("seriesProblems rejects a show that is still airing: the guide would go stale", () => {
  assert.deepEqual(seriesProblems(series([episode(1, 1)])), []);
  assert.deepEqual(seriesProblems(series([episode(1, 1)], "Running")), [
    'Test is still airing ("Running"): its data changes and the guide would go stale',
  ]);
});

test("seriesProblems detects seasons with gaps and empty shows", () => {
  assert.deepEqual(seriesProblems(series([episode(1, 1), episode(1, 3)])), ["S1: the episodes don't run from 1 to 2"]);
  assert.deepEqual(seriesProblems(series([])), ["Test has no episodes"]);
});

test("ratings and dates are formatted for display", () => {
  assert.equal(formatRating(8), "8.0");
  assert.equal(formatRating(9.25), "9.3");
  assert.equal(formatAirdate("2008-01-20"), "20 Jan 2008");
  assert.equal(formatAirdate(""), "no date");
  assert.match(formatBuiltAt(new Date(2026, 9, 19, 18, 12, 34)), /^19 Oct at 18:12:34$/);
});
