/** @jsxRuntime automatic */
// La guía de episodios de una serie terminada: sus datos ya no cambian, así que se genera una vez,
// en el build (SSG), y no hace falta reconstruirla hasta que cambie el código.
// Es HTML sin JavaScript: el realce al pasar el mouse y los recuadros con el episodio son solo CSS.
// (El pragma de arriba fija el runtime de JSX aunque tsx no vea este tsconfig, p. ej. en los tests.)
import type { ReactNode } from "react";
import {
  averageRating,
  bestEpisode,
  formatAirdate,
  formatRating,
  genreLabel,
  ratingLevel,
  ratingRange,
  seasonsOf,
  topEpisodes,
  type Episode,
  type RatingRange,
  type Series,
} from "./series.ts";

/** De dónde salieron los datos de la guía. */
export interface GuideSource {
  name: string;
  /** Enlace de atribución, si la fuente lo pide. */
  url?: string;
  /** Cuándo se pidieron, o por qué se usó la copia guardada. */
  detail: string;
}

export interface GuideProps {
  built: string;
  series: Series;
  buildMs: number;
  source: GuideSource;
}

/** Cuántos episodios van en "Los mejores episodios". */
export const TOP_COUNT = 3;

// Un tono por nivel (RATING_LEVELS), de la peor nota a la mejor. Las clases van completas para que
// Tailwind las encuentre al compilar.
const LEVEL_CLASSES: readonly string[] = [
  "gde:bg-ssg/10 gde:text-strong",
  "gde:bg-ssg/25 gde:text-strong",
  "gde:bg-ssg/45 gde:text-strong",
  "gde:bg-ssg/70 gde:text-strong",
  "gde:bg-ssg gde:text-card",
];

const label = (episode: Episode) => `T${episode.season} E${episode.number}`;
const caption =
  "gde:m-0 gde:font-mono gde:text-[10px] gde:leading-[normal] gde:tracking-[.08em] gde:text-muted gde:uppercase";

export function Guide({ built, series, buildMs, source }: GuideProps) {
  const seasons = seasonsOf(series.episodes);
  const columns = Math.max(0, ...seasons.map((season) => season.episodes.length));
  const range = ratingRange(series.episodes);
  const best = bestEpisode(series.episodes);
  const top = topEpisodes(series.episodes, TOP_COUNT);
  return (
    <section className="gde:grid gde:gap-5 gde:font-sans">
      <header className="gde:flex gde:min-h-8 gde:flex-wrap gde:items-center gde:justify-between gde:gap-x-3 gde:gap-y-1">
        <h3 className="gde:m-0 gde:text-[15px] gde:font-semibold gde:tracking-[-.01em] gde:text-strong">
          Guía de episodios
        </h3>
        <span className="gde:font-mono gde:text-[11px] gde:leading-[normal] gde:text-muted">
          generada en el build el <b className="gde:font-medium gde:text-ssg">{built}</b>
        </span>
      </header>

      <Hero series={series} seasons={seasons.length} years={yearsOf(seasons)} />

      {top.length > 0 && (
        <div className="gde:grid gde:gap-2.5">
          <p className={caption}>Los mejores episodios</p>
          <ol className="gde:m-0 gde:grid gde:list-none gde:grid-cols-3 gde:gap-3 gde:p-0 gde:max-md:snap-x gde:max-md:auto-cols-[78%] gde:max-md:grid-flow-col gde:max-md:grid-cols-none gde:max-md:overflow-x-auto gde:max-md:pb-1 gde:max-md:*:snap-start">
            {top.map((episode, index) => (
              <TopEpisode key={label(episode)} episode={episode} rank={index + 1} />
            ))}
          </ol>
        </div>
      )}

      <div className="gde:grid gde:gap-2.5">
        <div className="gde:flex gde:flex-wrap gde:items-center gde:justify-between gde:gap-x-4 gde:gap-y-1">
          <p className={caption}>Temporada por temporada</p>
          {range && (
            <span
              className="gde:flex gde:items-center gde:gap-1.5 gde:font-mono gde:text-[11px] gde:leading-[normal] gde:text-muted"
              aria-hidden="true"
            >
              {formatRating(range.min)}
              {LEVEL_CLASSES.map((classes) => (
                <i key={classes} className={`gde:inline-block gde:h-2.5 gde:w-4 gde:rounded-[3px] ${classes}`} />
              ))}
              {formatRating(range.max)}
            </span>
          )}
        </div>
        <div className="gde:max-md:overflow-x-auto">
          <table className="gde:w-full gde:min-w-140 gde:border-separate gde:border-spacing-[3px] gde:text-[12px]">
            <thead>
              <tr>
                <th className="gde:w-14" />
                {Array.from({ length: columns }, (_, index) => (
                  <th
                    key={index}
                    className="gde:pb-1 gde:text-center gde:font-mono gde:text-[10px] gde:leading-[normal] gde:font-normal gde:text-muted"
                  >
                    E{index + 1}
                  </th>
                ))}
                <th className="gde:w-12 gde:pb-1 gde:text-right gde:font-mono gde:text-[10px] gde:leading-[normal] gde:font-normal gde:text-muted">
                  media
                </th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season, row) => {
                const average = averageRating(season.episodes);
                return (
                  <tr key={season.number}>
                    <th className="gde:pr-2 gde:text-left gde:font-[550] gde:whitespace-nowrap gde:text-strong">
                      T{season.number}
                      <span className="gde:ml-1.5 gde:font-mono gde:text-[10px] gde:leading-[normal] gde:font-normal gde:text-muted">
                        {season.year}
                      </span>
                    </th>
                    {Array.from({ length: columns }, (_, index) => {
                      const episode = season.episodes.at(index);
                      return episode ? (
                        <EpisodeCell
                          key={index}
                          episode={episode}
                          range={range}
                          best={episode === best}
                          // La primera fila muestra el recuadro debajo, para que no se corte arriba.
                          below={row === 0}
                        />
                      ) : (
                        <td key={index} />
                      );
                    })}
                    <td className="gde:pl-1 gde:text-right gde:font-mono gde:text-[12px] gde:font-semibold gde:text-strong gde:tabular-nums">
                      {average === null ? "—" : formatRating(average)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="gde:flex gde:flex-wrap gde:items-center gde:gap-x-4 gde:gap-y-2 gde:border-t gde:border-faint gde:pt-3 gde:font-mono gde:text-[11px] gde:leading-[normal] gde:text-muted">
        <span>
          datos:{" "}
          {source.url ? (
            <a href={source.url} className="gde:text-text gde:underline gde:underline-offset-2">
              {source.name}
            </a>
          ) : (
            <b className="gde:font-medium gde:text-text">{source.name}</b>
          )}{" "}
          · {source.detail}
        </span>
        <span>generado en {buildMs} ms, una sola vez</span>
        <span>servido como archivo estático desde CDN</span>
      </footer>
    </section>
  );
}

/** "2008–2013": del año del primer episodio al del último. */
function yearsOf(seasons: readonly { year: string }[]): string {
  if (seasons.length === 0) return "";
  const first = seasons[0].year;
  const last = seasons[seasons.length - 1].year;
  return first === last ? first : `${first}–${last}`;
}

/**
 * La portada: siempre oscura, como la de una app de streaming, con la carátula desenfocada de
 * fondo. Los colores van fijos (no los del tema) porque el fondo es oscuro en los dos temas.
 */
function Hero({ series, seasons, years }: { series: Series; seasons: number; years: string }) {
  const average = averageRating(series.episodes);
  const facts = [series.network, years, ...(series.genres ?? []).slice(0, 3).map(genreLabel)].filter(Boolean);
  return (
    <div className="gde:relative gde:isolate gde:overflow-hidden gde:rounded-2xl gde:bg-[#0d0d0d] gde:text-white">
      {series.image && (
        <img
          src={series.image}
          alt=""
          aria-hidden="true"
          className="gde:absolute gde:inset-0 gde:-z-10 gde:size-full gde:scale-125 gde:object-cover gde:opacity-60 gde:blur-2xl gde:saturate-150"
        />
      )}
      <div
        aria-hidden="true"
        className="gde:absolute gde:inset-0 gde:-z-10 gde:bg-linear-90 gde:from-[#0d0d0d] gde:via-[#0d0d0d]/80 gde:to-[#0d0d0d]/25"
      />
      <div className="gde:grid gde:grid-cols-[104px_minmax(0,1fr)] gde:items-center gde:gap-5 gde:p-5 gde:max-sm:grid-cols-[76px_minmax(0,1fr)] gde:max-sm:gap-4 gde:max-sm:p-4">
        {series.image ? (
          <img
            src={series.image}
            alt={`Carátula de ${series.name}`}
            width={104}
            height={156}
            className="gde:block gde:aspect-[2/3] gde:w-full gde:rounded-lg gde:object-cover gde:shadow-[0_18px_40px_-12px_rgb(0_0_0/.85)] gde:ring-1 gde:ring-white/15"
          />
        ) : (
          <span aria-hidden="true" className="gde:block gde:aspect-[2/3] gde:w-full gde:rounded-lg gde:bg-white/10" />
        )}
        <div className="gde:grid gde:min-w-0 gde:gap-2">
          <span className="gde:flex gde:flex-wrap gde:items-center gde:gap-2">
            <span className="gde:rounded-full gde:bg-white/12 gde:px-2.5 gde:py-1 gde:font-mono gde:text-[10px] gde:leading-none gde:tracking-[.12em] gde:text-white/85 gde:uppercase">
              Serie completa
            </span>
            <span className="gde:rounded-full gde:bg-[#3dd68c]/18 gde:px-2.5 gde:py-1 gde:text-[11px] gde:leading-none gde:font-medium gde:text-[#7ef0b5]">
              terminada: estos datos ya no cambian
            </span>
          </span>
          <b className="gde:font-serif gde:text-[38px] gde:leading-[.95] gde:font-semibold gde:tracking-[-.01em] gde:text-white gde:max-sm:text-[28px]">
            {series.name}
          </b>
          <span className="gde:text-[13px] gde:text-white/70">{facts.join(" · ")}</span>
          <dl className="gde:m-0 gde:mt-1 gde:flex gde:flex-wrap gde:gap-x-6 gde:gap-y-2">
            <Metric label="nota media">
              <span className="gde:text-[#fbbf24]">★</span> {average === null ? "—" : formatRating(average)}
            </Metric>
            <Metric label="temporadas">{seasons}</Metric>
            <Metric label="episodios">{series.episodes.length}</Metric>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Metric({ label: name, children }: { label: string; children: ReactNode }) {
  return (
    // El valor se ve arriba y el nombre abajo, pero en el HTML va primero el <dt>, como pide <dl>.
    <div className="gde:grid gde:gap-0.5">
      <dt className="gde:order-2 gde:font-mono gde:text-[10px] gde:leading-[normal] gde:tracking-[.08em] gde:text-white/55 gde:uppercase">
        {name}
      </dt>
      <dd className="gde:order-1 gde:m-0 gde:text-[22px] gde:leading-none gde:font-semibold gde:tabular-nums">
        {children}
      </dd>
    </div>
  );
}

/** Uno de los mejores episodios: su captura, el puesto, la nota, el título y la fecha. */
function TopEpisode({ episode, rank }: { episode: Episode; rank: number }) {
  return (
    <li className="gde:group gde:overflow-hidden gde:rounded-xl gde:border gde:border-faint gde:bg-card gde:transition gde:duration-300 gde:hover:-translate-y-0.5 gde:hover:shadow-[0_14px_30px_-14px_rgb(0_0_0/.45)]">
      <div className="gde:relative gde:aspect-video gde:overflow-hidden gde:bg-faint">
        {episode.image && (
          <img
            src={episode.image}
            alt=""
            loading="lazy"
            className="gde:block gde:size-full gde:object-cover gde:transition-transform gde:duration-500 gde:group-hover:scale-105"
          />
        )}
        <div
          aria-hidden="true"
          className="gde:absolute gde:inset-0 gde:bg-linear-to-t gde:from-black/75 gde:via-black/0"
        />
        <span className="gde:absolute gde:bottom-1.5 gde:left-3 gde:font-serif gde:text-[40px] gde:leading-none gde:font-semibold gde:text-white gde:drop-shadow-[0_2px_6px_rgb(0_0_0/.6)]">
          {rank}
        </span>
        <span className="gde:absolute gde:top-2 gde:right-2 gde:rounded-full gde:bg-black/65 gde:px-2 gde:py-0.5 gde:text-[11.5px] gde:font-semibold gde:text-white">
          <span className="gde:text-[#fbbf24]">★</span> {formatRating(episode.rating ?? 0)}
        </span>
      </div>
      <div className="gde:grid gde:gap-0.5 gde:px-3 gde:py-2.5">
        <span className="gde:font-mono gde:text-[10.5px] gde:leading-[normal] gde:text-muted">
          {label(episode)} · {formatAirdate(episode.airdate)}
        </span>
        <b className="gde:truncate gde:text-[13.5px] gde:font-semibold gde:text-strong">{episode.name}</b>
      </div>
    </li>
  );
}

interface EpisodeCellProps {
  episode: Episode;
  range: RatingRange | null;
  best: boolean;
  below: boolean;
}

/** Un episodio: su nota con el tono que le toca y, al pasar el mouse, un recuadro con el título y la fecha. */
function EpisodeCell({ episode, range, best, below }: EpisodeCellProps) {
  const level = ratingLevel(episode.rating, range);
  return (
    <td
      className={`gde:group gde:relative gde:h-8 gde:min-w-8 gde:rounded-md gde:text-center gde:font-mono gde:text-[11px] gde:transition-transform gde:duration-150 gde:hover:z-10 gde:hover:scale-115 gde:hover:shadow-md ${level === null ? "gde:bg-faint/40 gde:text-muted" : LEVEL_CLASSES[level]} ${best ? "gde:outline-2 gde:outline-offset-1 gde:outline-strong" : ""}`}
    >
      {episode.rating === null ? "–" : formatRating(episode.rating)}
      <span
        className={`gde:pointer-events-none gde:absolute gde:left-1/2 gde:z-20 gde:grid gde:w-max gde:max-w-52 gde:-translate-x-1/2 gde:gap-0.5 gde:rounded-md gde:bg-strong gde:px-2.5 gde:py-1.5 gde:text-left gde:font-sans gde:text-[11px] gde:leading-snug gde:text-card gde:opacity-0 gde:shadow-lg gde:transition-opacity gde:duration-150 gde:group-hover:opacity-100 ${below ? "gde:top-[calc(100%+6px)]" : "gde:bottom-[calc(100%+6px)]"}`}
      >
        <b className="gde:font-semibold gde:text-card">
          {label(episode)} · {episode.name}
        </b>
        <span className="gde:opacity-75">{formatAirdate(episode.airdate)}</span>
      </span>
    </td>
  );
}
