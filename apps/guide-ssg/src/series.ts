// The episode guide's shape and its validation. Kept apart from the component and the build script
// so they can be tested.

export interface Episode {
  season: number;
  number: number;
  name: string;
  /** "2008-01-20". Empty if the source doesn't know. */
  airdate: string;
  /** Average TVmaze rating, from 0 to 10. */
  rating: number | null;
  /** A still from the episode (https, landscape and small), if TVmaze has one. */
  image?: string;
}

export interface Series {
  id: number;
  name: string;
  /** "Ended", "Running"… exactly as TVmaze gives it. */
  status: string;
  /** The network or platform it aired on. */
  network: string | null;
  /** Poster (https), if TVmaze has one. */
  image?: string;
  /** Genres, as TVmaze gives them ("Drama", "Crime"…). */
  genres?: string[];
  episodes: Episode[];
}

export interface Season {
  number: number;
  /** Year of the first episode. */
  year: string;
  /** In order: the one at position i is episode i + 1. */
  episodes: Episode[];
}

/** Groups the episodes by season, in order. */
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

/** The show's lowest and highest ratings, or null if no episode has a rating. */
export function ratingRange(episodes: readonly Episode[]): RatingRange | null {
  const ratings = episodes.flatMap((episode) => (episode.rating === null ? [] : [episode.rating]));
  return ratings.length === 0 ? null : { min: Math.min(...ratings), max: Math.max(...ratings) };
}

/** How many shades the heat map has. */
export const RATING_LEVELS = 5;

/** A rating's shade within the show: 0 for the worst, RATING_LEVELS - 1 for the best. */
export function ratingLevel(rating: number | null, range: RatingRange | null): number | null {
  if (rating === null || range === null) return null;
  if (range.max === range.min) return RATING_LEVELS - 1;
  const level = Math.floor(((rating - range.min) / (range.max - range.min)) * RATING_LEVELS);
  return Math.min(RATING_LEVELS - 1, level);
}

/** The average rating of the episodes that have one, or null if none do. */
export function averageRating(episodes: readonly Episode[]): number | null {
  const ratings = episodes.flatMap((episode) => (episode.rating === null ? [] : [episode.rating]));
  return ratings.length === 0 ? null : ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

/** The best-rated episodes, highest first; on a tie, the one that aired earlier goes first. */
export function topEpisodes(episodes: readonly Episode[], count: number): Episode[] {
  return episodes
    .filter((episode) => episode.rating !== null)
    .map((episode, index) => ({ episode, index }))
    .sort((a, b) => (b.episode.rating ?? 0) - (a.episode.rating ?? 0) || a.index - b.index)
    .slice(0, count)
    .map(({ episode }) => episode);
}

const GENRES: Readonly<Record<string, string>> = {
  "Science-Fiction": "Sci-Fi",
};

/** A TVmaze genre as a short label, or as is if it isn't on the list. */
export const genreLabel = (genre: string) => GENRES[genre] ?? genre;

/** The episode with the best rating; on a tie, the one that aired first. */
export function bestEpisode(episodes: readonly Episode[]): Episode | null {
  let best: Episode | null = null;
  for (const episode of episodes) {
    if (episode.rating !== null && (best?.rating == null || episode.rating > best.rating)) best = episode;
  }
  return best;
}

/**
 * The show's problems. The most important one comes first: the guide is SSG with no scheduled
 * rebuilds, so it only makes sense for a show that has ended, whose data no longer changes.
 */
export function seriesProblems(series: Series): string[] {
  const problems: string[] = [];
  if (series.status !== "Ended") {
    problems.push(`${series.name} is still airing ("${series.status}"): its data changes and the guide would go stale`);
  }
  if (series.episodes.length === 0) problems.push(`${series.name} has no episodes`);
  for (const season of seasonsOf(series.episodes)) {
    if (season.episodes.some((episode, index) => episode.number !== index + 1)) {
      problems.push(`S${season.number}: the episodes don't run from 1 to ${season.episodes.length}`);
    }
  }
  return problems;
}

/** The build's date and time as shown, e.g. "19 Oct at 18:12:34". */
export function formatBuiltAt(date: Date): string {
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} at ${date.toLocaleTimeString("en-GB", { hour12: false })}`;
}

/** "8.3": the rating with one decimal. */
export const formatRating = (rating: number) =>
  rating.toLocaleString("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "20 Jan 2008". */
export const formatAirdate = (airdate: string) =>
  airdate === ""
    ? "no date"
    : new Date(`${airdate}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
