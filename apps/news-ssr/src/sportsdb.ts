// Today's matches from TheSportsDB (https://www.thesportsdb.com), an open sports API.
// The free plan uses a public test key and returns a few matches per query.

export const SPORTSDB_API = "https://www.thesportsdb.com/api/v1/json";
export const SPORTSDB_SITE = "https://www.thesportsdb.com";

/** The test key TheSportsDB publishes for free use. Your own is passed with SPORTSDB_KEY. */
export const SPORTSDB_TEST_KEY = "123";

export interface Match {
  id: string;
  league: string;
  home: string;
  away: string;
  /** Match kickoff, in ISO 8601 (UTC). */
  kickoff: string;
  /** TheSportsDB status code: "NS" (not started), "1H", "HT", "FT"… */
  status: string;
  /** null if there's no score yet. */
  goals: [home: number, away: number] | null;
  /** The teams' badges (the small 50 px version), or null if they have none. */
  badges: [home: string | null, away: string | null];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toGoals = (value: unknown) => (value === null || value === "" ? NaN : Number(value));

/** Only badges served by TheSportsDB over https; "/tiny" requests the 50 px version (17 KB instead of 235). */
const toBadge = (value: unknown) =>
  typeof value === "string" && /^https:\/\/(r2|www)\.thesportsdb\.com\/images\/[\w/.-]+\.png$/.test(value)
    ? `${value}/tiny`
    : null;

/** Turns the eventsday.php response into matches. Ignores events with an unexpected shape. */
export function parseEvents(json: unknown): Match[] {
  if (!isRecord(json)) throw new Error("TheSportsDB: unexpected response");
  // A day without matches arrives as { events: null }.
  if (json.events === null) return [];
  if (!Array.isArray(json.events)) throw new Error("TheSportsDB: missing the list of events");
  return json.events.flatMap((event): Match[] => {
    if (!isRecord(event)) return [];
    const { idEvent, strLeague, strHomeTeam, strAwayTeam, strTimestamp, strStatus } = event;
    if (typeof idEvent !== "string" || typeof strHomeTeam !== "string" || typeof strAwayTeam !== "string") return [];
    if (typeof strTimestamp !== "string" || Number.isNaN(Date.parse(`${strTimestamp}Z`))) return [];
    const home = toGoals(event.intHomeScore);
    const away = toGoals(event.intAwayScore);
    return [
      {
        id: idEvent,
        league: typeof strLeague === "string" ? strLeague : "",
        home: strHomeTeam,
        away: strAwayTeam,
        // TheSportsDB gives the time in UTC but without the "Z".
        kickoff: new Date(`${strTimestamp}Z`).toISOString(),
        status: typeof strStatus === "string" && strStatus !== "" ? strStatus : "NS",
        goals: Number.isInteger(home) && Number.isInteger(away) ? [home, away] : null,
        badges: [toBadge(event.strHomeTeamBadge), toBadge(event.strAwayTeamBadge)],
      },
    ];
  });
}

const FINISHED = new Set(["FT", "AET", "PEN", "AWD", "WO", "Match Finished"]);
const LIVE = new Set(["1H", "2H", "ET", "BT", "P", "LIVE", "INT"]);

/** Which stage the match is at, to choose how to show it. */
export function phaseOf(match: Match): "upcoming" | "live" | "finished" | "other" {
  if (match.status === "NS" || match.status === "TBD") return "upcoming";
  if (match.status === "HT" || LIVE.has(match.status)) return "live";
  if (FINISHED.has(match.status)) return "finished";
  return "other";
}

/** What the status column shows: the kickoff time, "live", "full time"… */
export function statusLabel(match: Match, formatTime: (iso: string) => string): string {
  if (match.status === "NS" || match.status === "TBD") return formatTime(match.kickoff);
  if (match.status === "HT") return "half time";
  if (LIVE.has(match.status)) return "live";
  if (FINISHED.has(match.status)) return "full time";
  if (match.status === "PST") return "postponed";
  if (match.status === "CANC" || match.status === "ABD") return "called off";
  return match.status;
}

/** The football matches of a day (YYYY-MM-DD). */
export async function fetchMatches(
  date: string,
  { key = SPORTSDB_TEST_KEY, fetch: get = fetch, timeoutMs = 2500 } = {},
): Promise<Match[]> {
  const url = `${SPORTSDB_API}/${encodeURIComponent(key)}/eventsday.php?d=${date}&s=Soccer`;
  const response = await get(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`TheSportsDB: HTTP ${response.status}`);
  return parseEvents(await response.json());
}
