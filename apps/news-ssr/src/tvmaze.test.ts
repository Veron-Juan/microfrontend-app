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

test("parseWebSchedule pone primero los estrenos de temporada y después los más populares", () => {
  const items = parseWebSchedule(
    [
      episode(1, "Popular", 3, 5, 99),
      episode(2, "Estreno chico", 1, 1, 40, "Tubi"),
      episode(3, "Estreno grande", 2, 1, 90, "Prime Video"),
      episode(4, "Otro", 1, 2, 10),
    ],
    3,
  );
  assert.deepEqual(items, [
    // Solo carátulas https: la de "Estreno chico" es http y se descarta.
    {
      id: 3,
      show: "Estreno grande",
      episode: "T2 · estreno",
      platform: "Prime Video",
      image: "https://static.tvmaze.com/3.jpg",
    },
    { id: 2, show: "Estreno chico", episode: "T1 · estreno", platform: "Tubi", image: null },
    { id: 1, show: "Popular", episode: "T3 E5", platform: "Netflix", image: null },
  ]);
});

test("parseWebSchedule muestra cada programa una sola vez y descarta lo que no tiene forma de episodio", () => {
  const items = parseWebSchedule(
    [episode(1, "Maratón", 1, 1, 50), episode(1, "Maratón", 1, 2, 50), { season: 1 }, null, { _embedded: {} }],
    5,
  );
  assert.deepEqual(
    items.map((item) => item.episode),
    ["T1 · estreno"],
  );
  assert.throws(() => parseWebSchedule({}, 3), /lista de episodios/);
});

test("fetchPremieres pide el día y falla con un mensaje claro", async () => {
  const urls: string[] = [];
  const ok = async (url: string | URL | Request) => {
    urls.push(String(url));
    return Response.json([episode(1, "Uno", 1, 1, 50)]);
  };
  assert.equal((await fetchPremieres("2026-10-21", 3, { fetch: ok })).length, 1);
  assert.deepEqual(urls, ["https://api.tvmaze.com/schedule/web?date=2026-10-21"]);
  const down = async () => new Response("", { status: 500 });
  await assert.rejects(fetchPremieres("2026-10-21", 3, { fetch: down }), /HTTP 500/);
});
