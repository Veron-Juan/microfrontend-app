// La forma de la guía de episodios y su validación. Separadas del componente y del script de build
// para poder probarlas en un test.

export interface Episode {
  season: number;
  number: number;
  name: string;
  /** "2008-01-20". Vacío si la fuente no lo sabe. */
  airdate: string;
  /** Nota media en TVmaze, de 0 a 10. */
  rating: number | null;
  /** Una captura del episodio (https, apaisada y chica), si TVmaze tiene. */
  image?: string;
}

export interface Series {
  id: number;
  name: string;
  /** "Ended", "Running"… tal como lo da TVmaze. */
  status: string;
  /** El canal o la plataforma donde se emitió. */
  network: string | null;
  /** Carátula (https), si TVmaze tiene. */
  image?: string;
  /** Géneros, en inglés como los da TVmaze ("Drama", "Crime"…). */
  genres?: string[];
  episodes: Episode[];
}

export interface Season {
  number: number;
  /** Año del primer episodio. */
  year: string;
  /** En orden: el de la posición i es el episodio i + 1. */
  episodes: Episode[];
}

/** Agrupa los episodios por temporada, en orden. */
export function seasonsOf(episodes: readonly Episode[]): Season[] {
  const bySeason = new Map<number, Episode[]>();
  for (const episode of episodes) bySeason.set(episode.season, [...(bySeason.get(episode.season) ?? []), episode]);
  return [...bySeason.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, list]) => {
      const sorted = [...list].sort((a, b) => a.number - b.number);
      return { number, year: sorted[0].airdate.slice(0, 4), episodes: sorted };
    });
}

export interface RatingRange {
  min: number;
  max: number;
}

/** La nota más baja y la más alta de la serie, o null si ningún episodio tiene nota. */
export function ratingRange(episodes: readonly Episode[]): RatingRange | null {
  const ratings = episodes.flatMap((episode) => (episode.rating === null ? [] : [episode.rating]));
  return ratings.length === 0 ? null : { min: Math.min(...ratings), max: Math.max(...ratings) };
}

/** Cuántos tonos tiene el mapa de calor. */
export const RATING_LEVELS = 5;

/** El tono de una nota dentro de la serie: 0 para la peor, RATING_LEVELS - 1 para la mejor. */
export function ratingLevel(rating: number | null, range: RatingRange | null): number | null {
  if (rating === null || range === null) return null;
  if (range.max === range.min) return RATING_LEVELS - 1;
  const level = Math.floor(((rating - range.min) / (range.max - range.min)) * RATING_LEVELS);
  return Math.min(RATING_LEVELS - 1, level);
}

/** La nota media de los episodios que tienen nota, o null si ninguno tiene. */
export function averageRating(episodes: readonly Episode[]): number | null {
  const ratings = episodes.flatMap((episode) => (episode.rating === null ? [] : [episode.rating]));
  return ratings.length === 0 ? null : ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

/** Los episodios con mejor nota, de mayor a menor; si empatan, primero el que salió antes. */
export function topEpisodes(episodes: readonly Episode[], count: number): Episode[] {
  return episodes
    .filter((episode) => episode.rating !== null)
    .map((episode, index) => ({ episode, index }))
    .sort((a, b) => (b.episode.rating ?? 0) - (a.episode.rating ?? 0) || a.index - b.index)
    .slice(0, count)
    .map(({ episode }) => episode);
}

const GENRES: Readonly<Record<string, string>> = {
  Action: "Acción",
  Adventure: "Aventura",
  Comedy: "Comedia",
  Crime: "Crimen",
  Drama: "Drama",
  Family: "Familia",
  Fantasy: "Fantasía",
  History: "Historia",
  Horror: "Terror",
  Medical: "Médica",
  Music: "Música",
  Mystery: "Misterio",
  Romance: "Romance",
  "Science-Fiction": "Ciencia ficción",
  Sports: "Deportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspenso",
  War: "Bélica",
  Western: "Western",
};

/** Un género de TVmaze en español, o tal cual si no está en la lista. */
export const genreLabel = (genre: string) => GENRES[genre] ?? genre;

/** El episodio con la mejor nota; si empatan, el que salió primero. */
export function bestEpisode(episodes: readonly Episode[]): Episode | null {
  let best: Episode | null = null;
  for (const episode of episodes) {
    if (episode.rating !== null && (best?.rating == null || episode.rating > best.rating)) best = episode;
  }
  return best;
}

/**
 * Problemas de la serie. El más importante es el primero: la guía es SSG sin rebuilds programados,
 * así que solo tiene sentido con una serie terminada, cuyos datos ya no cambian.
 */
export function seriesProblems(series: Series): string[] {
  const problems: string[] = [];
  if (series.status !== "Ended") {
    problems.push(`${series.name} sigue en emisión ("${series.status}"): sus datos cambian y la guía quedaría vieja`);
  }
  if (series.episodes.length === 0) problems.push(`${series.name} no tiene episodios`);
  for (const season of seasonsOf(series.episodes)) {
    if (season.episodes.some((episode, index) => episode.number !== index + 1)) {
      problems.push(`T${season.number}: los episodios no van del 1 al ${season.episodes.length}`);
    }
  }
  return problems;
}

/** Fecha y hora del build tal como se muestra, p. ej. "19 oct a las 18:12:34". */
export function formatBuiltAt(date: Date): string {
  return `${date.toLocaleDateString("es", { day: "2-digit", month: "short" })} a las ${date.toLocaleTimeString("es", { hour12: false })}`;
}

/** "8,3": la nota con un decimal, como se escribe en español. */
export const formatRating = (rating: number) =>
  rating.toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "20 ene 2008". */
export const formatAirdate = (airdate: string) =>
  airdate === ""
    ? "sin fecha"
    : new Date(`${airdate}T12:00:00Z`).toLocaleDateString("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
