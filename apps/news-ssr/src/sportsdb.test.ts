import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchMatches, parseEvents, phaseOf, statusLabel, type Match } from "./sportsdb.ts";

const event = (overrides: Record<string, unknown> = {}) => ({
  idEvent: "2398136",
  strLeague: "Argentinian Primera Division",
  strHomeTeam: "Deportivo Riestra",
  strAwayTeam: "Unión",
  strTimestamp: "2026-10-20T00:15:00",
  intHomeScore: "1",
  intAwayScore: "1",
  strStatus: "FT",
  strHomeTeamBadge: "https://r2.thesportsdb.com/images/media/team/badge/abc123.png",
  strAwayTeamBadge: null,
  ...overrides,
});

test("parseEvents turns a TheSportsDB event into a match with the time in UTC", () => {
  assert.deepEqual(parseEvents({ events: [event()] }), [
    {
      id: "2398136",
      league: "Argentinian Primera Division",
      home: "Deportivo Riestra",
      away: "Unión",
      kickoff: "2026-10-20T00:15:00.000Z",
      status: "FT",
      goals: [1, 1],
      badges: ["https://r2.thesportsdb.com/images/media/team/badge/abc123.png/tiny", null],
    },
  ]);
});

test("parseEvents only accepts https badges from TheSportsDB", () => {
  const badges = (home: unknown) => parseEvents({ events: [event({ strHomeTeamBadge: home })] })[0].badges[0];
  assert.equal(badges("http://r2.thesportsdb.com/images/media/team/badge/a.png"), null);
  assert.equal(badges("https://evil.test/images/a.png"), null);
  assert.equal(badges('https://r2.thesportsdb.com/images/a.png" onerror="x'), null);
});

test("phaseOf groups TheSportsDB's statuses", () => {
  const phase = (status: string) => phaseOf({ ...parseEvents({ events: [event()] })[0], status });
  assert.deepEqual(["NS", "2H", "HT", "FT", "PST"].map(phase), ["upcoming", "live", "live", "finished", "other"]);
});

test("parseEvents leaves the score null if the match hasn't started", () => {
  const [match] = parseEvents({ events: [event({ intHomeScore: null, intAwayScore: null, strStatus: "NS" })] });
  assert.equal(match.goals, null);
  assert.equal(match.status, "NS");
});

test("parseEvents accepts a day without matches and drops incomplete events", () => {
  assert.deepEqual(parseEvents({ events: null }), []);
  assert.deepEqual(
    parseEvents({ events: [event({ strHomeTeam: null }), event({ strTimestamp: "yesterday" }), 7] }),
    [],
  );
  assert.throws(() => parseEvents("<html>"), /unexpected response/);
  assert.throws(() => parseEvents({}), /list of events/);
});

test("statusLabel labels the statuses and shows the kickoff time if not started", () => {
  const match = (status: string): Match => ({ ...parseEvents({ events: [event()] })[0], status });
  const time = () => "21:15";
  assert.equal(statusLabel(match("NS"), time), "21:15");
  assert.equal(statusLabel(match("1H"), time), "live");
  assert.equal(statusLabel(match("HT"), time), "half time");
  assert.equal(statusLabel(match("FT"), time), "full time");
  assert.equal(statusLabel(match("PST"), time), "postponed");
  assert.equal(statusLabel(match("XYZ"), time), "XYZ");
});

test("fetchMatches requests the day with the given key and fails with a clear message", async () => {
  const urls: string[] = [];
  const ok = async (url: string | URL | Request) => {
    urls.push(String(url));
    return Response.json({ events: null });
  };
  assert.deepEqual(await fetchMatches("2026-10-21", { fetch: ok }), []);
  await fetchMatches("2026-10-21", { fetch: ok, key: "mykey" });
  assert.deepEqual(urls, [
    "https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2026-10-21&s=Soccer",
    "https://www.thesportsdb.com/api/v1/json/mykey/eventsday.php?d=2026-10-21&s=Soccer",
  ]);
  const limited = async () => new Response("", { status: 429 });
  await assert.rejects(fetchMatches("2026-10-21", { fetch: limited }), /HTTP 429/);
});
