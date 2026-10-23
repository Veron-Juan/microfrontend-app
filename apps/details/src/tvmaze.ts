// A show's details, fetched by the browser from TVmaze (https://www.tvmaze.com/api): free, keyless
// and with CORS. It requires attribution (CC BY-SA), which goes in the card's footer.

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

/** How many cast members are shown. */
export const CAST_COUNT = 4;

export interface CastMember {
  person: string;
  character: string | null;
  /** The person's small photo (https), or null. */
  image: string | null;
}

export interface ShowDetails {
  id: number;
  name: string;
  /** Its TVmaze page, for the attribution link. */
  url: string;
  /** "Ended", "Running"… exactly as TVmaze gives it. */
  status: string;
  premiered: string | null;
  ended: string | null;
  /** The network or platform. */
  network: string | null;
  rating: number | null;
  seasons: number;
  /** The summary as plain text. */
  summary: string;
  cast: CastMember[];
  /** https URL of the large poster. */
  image?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nameOf = (value: unknown) => (isRecord(value) && typeof value.name === "string" ? value.name : null);

const ENTITIES: Readonly<Record<string, string>> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * TVmaze sends the summary as HTML ("<p><b>Breaking Bad</b> follows…"). It's never inserted as
 * HTML: its tags are stripped and React escapes the remaining text. That way a summary with a
 * <script> or an <img onerror> can't run anything on the shell's page.
 */
export function summaryText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#")) {
        const point = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
        return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
      }
      return ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Keeps what the details page uses. The response comes from a third party: it's validated field by field. */
export function parseDetails(json: unknown): ShowDetails {
  if (!isRecord(json) || typeof json.id !== "number" || typeof json.name !== "string") {
    throw new Error("TVmaze: expected a show");
  }
  const embedded = isRecord(json._embedded) ? json._embedded : {};
  const cast = Array.isArray(embedded.cast) ? embedded.cast : [];
  const seasons = Array.isArray(embedded.seasons) ? embedded.seasons : [];
  const image = isRecord(json.image) && typeof json.image.medium === "string" ? json.image.medium : "";
  const date = (value: unknown) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
  return {
    id: json.id,
    name: json.name,
    url: typeof json.url === "string" && json.url.startsWith(`${TVMAZE_SITE}/`) ? json.url : TVMAZE_SITE,
    status: typeof json.status === "string" ? json.status : "Unknown",
    premiered: date(json.premiered),
    ended: date(json.ended),
    // TV shows have a network; streaming ones, a webChannel.
    network: nameOf(json.network) ?? nameOf(json.webChannel),
    rating: isRecord(json.rating) && typeof json.rating.average === "number" ? json.rating.average : null,
    seasons: seasons.length,
    summary: typeof json.summary === "string" ? summaryText(json.summary) : "",
    cast: cast
      .flatMap((item): CastMember[] => {
        if (!isRecord(item)) return [];
        const person = nameOf(item.person);
        if (!person) return [];
        const photo = isRecord(item.person) && isRecord(item.person.image) ? item.person.image.medium : null;
        const image = typeof photo === "string" && photo.startsWith("https://") ? photo : null;
        return [{ person, character: nameOf(item.character), image }];
      })
      .slice(0, CAST_COUNT),
    ...(image.startsWith("https://") && { image }),
  };
}

/** Fetches the full details (with cast and seasons) in a single call. */
export async function fetchDetails(id: number, signal?: AbortSignal): Promise<ShowDetails> {
  const response = await fetch(`${TVMAZE_API}/shows/${id}?embed[]=cast&embed[]=seasons`, { signal });
  if (!response.ok) throw new Error(`TVmaze: HTTP ${response.status}`);
  return parseDetails(await response.json());
}
