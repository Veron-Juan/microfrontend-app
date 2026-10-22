import type { Show } from "@mfe/contracts";
import { artGradient, minutes } from "./format.ts";

interface ShowCardProps {
  show: Show;
  /** Si es el título que está en la ficha. */
  selected: boolean;
  onSelect: (show: Show) => void;
}

/** Una tarjeta del catálogo: la carátula (la imagen, o un degradado rayado si no hay) y el título. */
export function ShowCard({ show, selected, onSelect }: ShowCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(show)}
      aria-pressed={selected}
      aria-label={`Ver la ficha de ${show.title}`}
      className="cat:group cat:m-0 cat:flex cat:min-w-0 cat:cursor-pointer cat:flex-col cat:gap-2 cat:border-0 cat:bg-transparent cat:p-0 cat:text-left cat:font-[inherit] cat:text-[inherit] cat:outline-none"
    >
      <span
        aria-hidden="true"
        className="cat:relative cat:block cat:aspect-[2/3] cat:overflow-hidden cat:rounded-lg cat:shadow-[0_1px_2px_rgb(0_0_0/.12)] cat:ring-1 cat:ring-line-soft cat:transition cat:duration-300 cat:ease-out-soft cat:group-hover:-translate-y-1 cat:group-hover:shadow-[0_10px_24px_-8px_rgb(0_0_0/.35)] cat:group-focus-visible:-translate-y-1 cat:group-focus-visible:ring-2 cat:group-focus-visible:ring-mid cat:group-aria-pressed:ring-2 cat:group-aria-pressed:ring-csr cat:before:absolute cat:before:inset-0 cat:before:bg-[repeating-linear-gradient(135deg,transparent_0_7px,rgba(255,255,255,.06)_7px_8px)] cat:before:content-['']"
        style={{ background: artGradient(show.hue) }}
      >
        {show.image ? (
          <img
            src={show.image}
            alt=""
            loading="lazy"
            className="cat:absolute cat:inset-0 cat:block cat:size-full cat:object-cover cat:transition-transform cat:duration-500 cat:ease-out-soft cat:group-hover:scale-[1.04]"
          />
        ) : (
          <b className="cat:absolute cat:bottom-2 cat:left-2.5 cat:font-serif cat:text-[22px] cat:leading-none cat:font-semibold cat:text-white cat:opacity-92">
            {show.title.split(" ")[0]}
          </b>
        )}
        {selected && (
          <span className="cat:absolute cat:top-1.5 cat:left-1.5 cat:rounded-full cat:bg-csr cat:px-2 cat:py-0.5 cat:font-mono cat:text-[10px] cat:leading-[normal] cat:font-medium cat:text-white cat:shadow-sm">
            en la ficha
          </span>
        )}
      </span>
      <span className="cat:grid cat:min-w-0 cat:gap-0.5">
        <span
          title={show.title}
          className="cat:truncate cat:text-[13px] cat:leading-snug cat:font-[550] cat:text-strong cat:group-aria-pressed:text-csr"
        >
          {show.title}
        </span>
        <span className="cat:truncate cat:font-mono cat:text-[11px] cat:leading-[normal] cat:text-muted">
          {show.kind} · {minutes(show.length)}
        </span>
      </span>
    </button>
  );
}
