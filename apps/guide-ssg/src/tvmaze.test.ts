import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchSeries, parseSeries } from "./tvmaze.ts";

const tvmazeEpisode = (season: number, number: number | null, overrides: Record<string, unknown> = {}) => ({
  id: season * 100 + (number ?? 0),
  name: `Episodio ${number}`,
  season,
  number,
  type: number === null ? "significant_special" : "regular",
  airdate: "2008-01-20",
  rating: { average: 8.3 },
  summary: "<p>A summary with <b>HTML</b> the guide doesn't use.</p>",
  ...overrides,
});

const tvmazeShow = (overrides: Record<string, unknown> = {}) => ({
  id: 169,
  name: "Breaking Bad",
  status: "Ended",
  network: { id: 20, name: "AMC" },
  webChannel: null,
  genres: ["Drama", "Crime", 7],
  image: { medium: "https://static.tvmaze.com/poster.jpg" },
  _embedded: {
    episodes: [
      tvmazeEpisode(1, 1, { image: { medium: "https://static.tvmaze.com/e1.jpg" } }),
      tvmazeEpisode(1, 2, { rating: { average: null }, airdate: "", image: { medium: "http://x.test/e2.jpg" } }),
    ],
  },
  ...overrides,
});

test("parseSeries keeps the show and the data the guide uses", () => {
  assert.deepEqual(parseSeries(tvmazeShow()), {
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
        name: "Episodio 1",
        airdate: "2008-01-20",
        rating: 8.3,
        image: "https://static.tvmaze.com/e1.jpg",
      },
      // https images only: the http still is dropped.
      { season: 1, number: 2, name: "Episodio 2", airdate: "", rating: null },
    ],
  });
});

test("parseSeries drops specials and malformed episodes, and uses webChannel if there's no network", () => {
  const series = parseSeries(
    tvmazeShow({
      network: null,
      webChannel: { id: 1, name: "Netflix" },
      _embedded: { episodes: [tvmazeEpisode(1, 1), tvmazeEpisode(1, null), { name: 3 }, null] },
    }),
  );
  assert.equal(series.network, "Netflix");
  assert.deepEqual(
    series.episodes.map((episode) => episode.number),
    [1],
  );
});

test("parseSeries fails if the response isn't a show or has no episodes", () => {
  assert.throws(() => parseSeries([]), /expected a show/);
  assert.throws(() => parseSeries(tvmazeShow({ _embedded: undefined })), /missing embed=episodes/);
});

test("fetchSeries fetches the show with its episodes in a single call", async () => {
  const urls: string[] = [];
  const fake = (url: string | URL | Request) => {
    urls.push(String(url));
    return Promise.resolve(Response.json(tvmazeShow()));
  };
  const series = await fetchSeries(169, { fetch: fake as typeof fetch });
  assert.equal(series.episodes.length, 2);
  assert.deepEqual(urls, ["https://api.tvmaze.com/shows/169?embed=episodes"]);
});

test("fetchSeries fails with a clear error if TVmaze responds badly", async () => {
  const fake = () => Promise.resolve(new Response("", { status: 503 }));
  await assert.rejects(fetchSeries(169, { fetch: fake as typeof fetch }), /TVmaze: HTTP 503/);
});
