import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPremieres, parseWebSchedule } from "./tvmaze.ts";

const episode = (id: number, name: string, season: number, number: number, weight: number, platform = "Netflix") => ({
  season,
  number,
  _embedded: {
    show: {
      id,
      name,
      weight,
      webChannel: { name: platform },
      image:
        id === 3 ? { medium: "https://static.tvmaze.com/3.jpg" } : id === 2 ? { medium: "http://x.test/2.jpg" } : null,
    },
  },
});

test("parseWebSchedule puts season premieres first and then the most popular", () => {
  const items = parseWebSchedule(
    [
      episode(1, "Popular", 3, 5, 99),
      episode(2, "Small premiere", 1, 1, 40, "Tubi"),
      episode(3, "Big premiere", 2, 1, 90, "Prime Video"),
      episode(4, "Other", 1, 2, 10),
    ],
    3,
  );
  assert.deepEqual(items, [
    // https posters only: the one for "Small premiere" is http and is dropped.
    {
      id: 3,
      show: "Big premiere",
      episode: "S2 · premiere",
      platform: "Prime Video",
      image: "https://static.tvmaze.com/3.jpg",
    },
    { id: 2, show: "Small premiere", episode: "S1 · premiere", platform: "Tubi", image: null },
    { id: 1, show: "Popular", episode: "S3 E5", platform: "Netflix", image: null },
  ]);
});

test("parseWebSchedule shows each show only once and drops anything not shaped like an episode", () => {
  const items = parseWebSchedule(
    [episode(1, "Marathon", 1, 1, 50), episode(1, "Marathon", 1, 2, 50), { season: 1 }, null, { _embedded: {} }],
    5,
  );
  assert.deepEqual(
    items.map((item) => item.episode),
    ["S1 · premiere"],
  );
  assert.throws(() => parseWebSchedule({}, 3), /list of episodes/);
});

test("fetchPremieres requests the day and fails with a clear message", async () => {
  const urls: string[] = [];
  const ok = async (url: string | URL | Request) => {
    urls.push(String(url));
    return Response.json([episode(1, "One", 1, 1, 50)]);
  };
  assert.equal((await fetchPremieres("2026-10-21", 3, { fetch: ok })).length, 1);
  assert.deepEqual(urls, ["https://api.tvmaze.com/schedule/web?date=2026-10-21"]);
  const down = async () => new Response("", { status: 500 });
  await assert.rejects(fetchPremieres("2026-10-21", 3, { fetch: down }), /HTTP 500/);
});
