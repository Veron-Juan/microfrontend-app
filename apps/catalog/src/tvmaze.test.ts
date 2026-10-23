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

test("toShow takes the genre, converts the runtime to seconds and keeps the poster", () => {
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

test("toShow uses the format if there are no genres, and defaults if data is missing", () => {
  const show = toShow(
    tvmazeShow(1, "Newsroom", { genres: [], type: "News", averageRuntime: null, runtime: null, image: null }),
  );
  assert.equal(show?.kind, "News");
  assert.equal(show?.length, 1800);
  assert.equal(show?.image, undefined);
  assert.equal(toShow(tvmazeShow(2, "Odd", { genres: ["Kaiju"] }))?.kind, "Kaiju");
});

test("toShow drops shows without an id or name, and images that aren't https", () => {
  assert.equal(toShow({ name: "No id" }), null);
  assert.equal(toShow(null), null);
  assert.equal(toShow(tvmazeShow(3, "Http", { image: { medium: "http://x/y.jpg" } }))?.image, undefined);
});

test("popularShows sorts by popularity and keeps the top ones", () => {
  const shows = popularShows(
    [
      tvmazeShow(1, "Low", { weight: 10 }),
      tvmazeShow(2, "High", { weight: 99 }),
      { broken: true },
      tvmazeShow(3, "Mid", { weight: 50 }),
    ],
    2,
  );
  assert.deepEqual(
    shows.map((show) => show.title),
    ["High", "Mid"],
  );
  assert.throws(() => popularShows({}), /list of shows/);
});

test("searchResults keeps TVmaze's relevance order", () => {
  const shows = searchResults([
    { score: 0.9, show: tvmazeShow(10, "Star Trek") },
    { score: 0.5, show: tvmazeShow(11, "Lone Star") },
    { score: 0.1 },
  ]);
  assert.deepEqual(
    shows.map((show) => show.title),
    ["Star Trek", "Lone Star"],
  );
  assert.throws(() => searchResults(null), /list of results/);
});
