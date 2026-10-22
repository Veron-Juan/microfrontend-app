// Partidos del día desde TheSportsDB (https://www.thesportsdb.com), una API abierta de deportes.
// El plan gratuito usa una key pública de prueba y devuelve unos pocos partidos por consulta.

export const SPORTSDB_API = "https://www.thesportsdb.com/api/v1/json";
export const SPORTSDB_SITE = "https://www.thesportsdb.com";

/** La key de prueba que TheSportsDB publica para uso gratuito. Una propia se pasa con SPORTSDB_KEY. */
export const SPORTSDB_TEST_KEY = "123";

export interface Match {
  id: string;
  league: string;
  home: string;
  away: string;
  /** Inicio del partido, en ISO 8601 (UTC). */
  kickoff: string;
  /** Código de estado de TheSportsDB: "NS" (no empezó), "1H", "HT", "FT"… */
  status: string;
  /** null si todavía no hay marcador. */
  goals: [home: number, away: number] | null;
  /** Escudos de los equipos (la versión chica, de 50 px), o null si no tienen. */
  badges: [home: string | null, away: string | null];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toGoals = (value: unknown) => (value === null || value === "" ? NaN : Number(value));

/** Solo escudos servidos por TheSportsDB por https; "/tiny" pide la versión de 50 px (17 KB en vez de 235). */
const toBadge = (value: unknown) =>
  typeof value === "string" && /^https:\/\/(r2|www)\.thesportsdb\.com\/images\/[\w/.-]+\.png$/.test(value)
    ? `${value}/tiny`
    : null;

/** Convierte la respuesta de eventsday.php en partidos. Ignora los eventos con una forma inesperada. */
export function parseEvents(json: unknown): Match[] {
  if (!isRecord(json)) throw new Error("TheSportsDB: respuesta inesperada");
  // Un día sin partidos llega como { events: null }.
  if (json.events === null) return [];
  if (!Array.isArray(json.events)) throw new Error("TheSportsDB: falta la lista de eventos");
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
        // TheSportsDB da la hora en UTC pero sin la "Z".
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

/** En qué momento está el partido, para elegir cómo mostrarlo. */
export function phaseOf(match: Match): "upcoming" | "live" | "finished" | "other" {
  if (match.status === "NS" || match.status === "TBD") return "upcoming";
  if (match.status === "HT" || LIVE.has(match.status)) return "live";
  if (FINISHED.has(match.status)) return "finished";
  return "other";
}

/** Lo que muestra la columna de estado: la hora de inicio, "en vivo", "final"… */
export function statusLabel(match: Match, formatTime: (iso: string) => string): string {
  if (match.status === "NS" || match.status === "TBD") return formatTime(match.kickoff);
  if (match.status === "HT") return "entretiempo";
  if (LIVE.has(match.status)) return "en vivo";
  if (FINISHED.has(match.status)) return "final";
  if (match.status === "PST") return "postergado";
  if (match.status === "CANC" || match.status === "ABD") return "suspendido";
  return match.status;
}

/** Los partidos de fútbol de un día (AAAA-MM-DD). */
export async function fetchMatches(
  date: string,
  { key = SPORTSDB_TEST_KEY, fetch: get = fetch, timeoutMs = 2500 } = {},
): Promise<Match[]> {
  const url = `${SPORTSDB_API}/${encodeURIComponent(key)}/eventsday.php?d=${date}&s=Soccer`;
  const response = await get(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`TheSportsDB: HTTP ${response.status}`);
  return parseEvents(await response.json());
}
