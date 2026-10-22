// La ficha de un programa, pedida por el navegador a TVmaze (https://www.tvmaze.com/api): gratis,
// sin key y con CORS. Exige atribución (CC BY-SA), que va en el pie de la ficha.

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

/** Cuántas personas del elenco se muestran. */
export const CAST_COUNT = 4;

export interface CastMember {
  person: string;
  character: string | null;
  /** Foto chica (https) de la persona, o null. */
  image: string | null;
}

export interface ShowDetails {
  id: number;
  name: string;
  /** Su página en TVmaze, para el enlace de atribución. */
  url: string;
  /** "Ended", "Running"… tal como lo da TVmaze. */
  status: string;
  premiered: string | null;
  ended: string | null;
  /** El canal o la plataforma. */
  network: string | null;
  rating: number | null;
  seasons: number;
  /** El resumen como texto plano. */
  summary: string;
  cast: CastMember[];
  /** URL https de la carátula grande. */
  image?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nameOf = (value: unknown) => (isRecord(value) && typeof value.name === "string" ? value.name : null);

const ENTITIES: Readonly<Record<string, string>> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * TVmaze manda el resumen como HTML ("<p><b>Breaking Bad</b> follows…"). Nunca se inserta como
 * HTML: se le quitan las etiquetas y React escapa el texto que queda. Así un resumen con un
 * <script> o un <img onerror> no puede ejecutar nada en la página del shell.
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

/** Se queda con lo que usa la ficha. La respuesta viene de un tercero: se valida campo por campo. */
export function parseDetails(json: unknown): ShowDetails {
  if (!isRecord(json) || typeof json.id !== "number" || typeof json.name !== "string") {
    throw new Error("TVmaze: se esperaba un programa");
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
    // Las series de TV tienen network; las de streaming, webChannel.
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

/** Pide la ficha completa (con elenco y temporadas) en una sola llamada. */
export async function fetchDetails(id: number, signal?: AbortSignal): Promise<ShowDetails> {
  const response = await fetch(`${TVMAZE_API}/shows/${id}?embed[]=cast&embed[]=seasons`, { signal });
  if (!response.ok) throw new Error(`TVmaze: HTTP ${response.status}`);
  return parseDetails(await response.json());
}
