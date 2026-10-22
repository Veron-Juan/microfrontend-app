// El catálogo real: TVmaze (https://www.tvmaze.com/api), gratis, sin key y con CORS, así que el
// navegador lo consulta directo. Pide atribución (CC BY-SA). Solo usamos nombres, géneros e
// imágenes: nunca el HTML de los resúmenes.
import type { Show } from "@mfe/contracts";

export const TVMAZE_API = "https://api.tvmaze.com";
export const TVMAZE_SITE = "https://www.tvmaze.com";

/** Cuántos títulos muestra el catálogo. */
export const SHOW_COUNT = 8;

const GENRES: Readonly<Record<string, string>> = {
  Action: "Acción",
  Adventure: "Aventura",
  Anime: "Anime",
  Children: "Infantil",
  Comedy: "Comedia",
  Crime: "Policial",
  Drama: "Drama",
  Espionage: "Espionaje",
  Family: "Familiar",
  Fantasy: "Fantasía",
  Food: "Cocina",
  History: "Historia",
  Horror: "Terror",
  Legal: "Legal",
  Medical: "Médico",
  Music: "Música",
  Mystery: "Misterio",
  Nature: "Naturaleza",
  Romance: "Romance",
  "Science-Fiction": "Ciencia ficción",
  Sports: "Deportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspenso",
  Travel: "Viajes",
  War: "Bélico",
  Western: "Western",
};

const TYPES: Readonly<Record<string, string>> = {
  Animation: "Animación",
  Documentary: "Documental",
  "Game Show": "Concurso",
  News: "Noticias",
  Reality: "Reality",
  Scripted: "Serie",
  Sports: "Deportes",
  "Talk Show": "Entrevistas",
  Variety: "Variedades",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** El tipo que muestra el catálogo: el primer género, o el formato si no tiene géneros. */
function kindOf(genres: unknown, type: unknown): string {
  const genre = Array.isArray(genres) && typeof genres[0] === "string" ? genres[0] : null;
  if (genre) return GENRES[genre] ?? genre;
  return typeof type === "string" ? (TYPES[type] ?? type) : "Serie";
}

/** Convierte un programa de TVmaze en un título del catálogo, o null si le falta lo esencial. */
export function toShow(json: unknown): Show | null {
  if (!isRecord(json) || typeof json.id !== "number" || typeof json.name !== "string") return null;
  const runtime = [json.averageRuntime, json.runtime].find((value) => typeof value === "number" && value > 0);
  const image = isRecord(json.image) && typeof json.image.medium === "string" ? json.image.medium : "";
  return {
    id: `tvmaze-${json.id}`,
    title: json.name,
    kind: kindOf(json.genres, json.type),
    length: ((runtime as number | undefined) ?? 30) * 60,
    // Un tono estable por programa, para cuando no hay imagen.
    hue: (json.id * 47) % 360,
    tvmazeId: json.id,
    ...(image.startsWith("https://") && { image }),
  };
}

const weightOf = (json: unknown) => (isRecord(json) && typeof json.weight === "number" ? json.weight : 0);

/** Los más populares de la primera página del índice de TVmaze. */
export function popularShows(json: unknown, count = SHOW_COUNT): Show[] {
  if (!Array.isArray(json)) throw new Error("TVmaze: se esperaba una lista de programas");
  return [...json]
    .sort((a, b) => weightOf(b) - weightOf(a))
    .map(toShow)
    .filter((show) => show !== null)
    .slice(0, count);
}

/** Los resultados de /search/shows, en el orden de relevancia que da TVmaze. */
export function searchResults(json: unknown, count = SHOW_COUNT): Show[] {
  if (!Array.isArray(json)) throw new Error("TVmaze: se esperaba una lista de resultados");
  return json
    .map((result) => (isRecord(result) ? toShow(result.show) : null))
    .filter((show) => show !== null)
    .slice(0, count);
}

async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${TVMAZE_API}${path}`, { signal });
  if (!response.ok) throw new Error(`TVmaze: HTTP ${response.status}`);
  return response.json();
}

/** Lo que muestra el catálogo al abrirse. */
export async function fetchPopularShows(signal?: AbortSignal): Promise<Show[]> {
  return popularShows(await getJson("/shows?page=0", signal));
}

/** Busca programas por nombre. */
export async function searchShows(query: string, signal?: AbortSignal): Promise<Show[]> {
  return searchResults(await getJson(`/search/shows?q=${encodeURIComponent(query)}`, signal));
}
