import type { Show } from "@mfe/contracts";
import { artGradient, minutes } from "./format.ts";

interface ShowCardProps {
  show: Show;
  onPlay: (show: Show) => void;
}

/** Una tarjeta del catálogo: la carátula (degradado + rayado) y el título. */
export function ShowCard({ show, onPlay }: ShowCardProps) {
  return (
    <button
      type="button"
      onClick={() => onPlay(show)}
      aria-label={`Reproducir ${show.title}`}
      className="cat:m-0 cat:box-border cat:flex cat:cursor-pointer cat:flex-col cat:overflow-hidden cat:rounded-[10px] cat:border cat:border-faint cat:bg-card cat:p-0 cat:text-left cat:font-[inherit] cat:text-[inherit] cat:transition cat:duration-250 cat:ease-out-soft cat:outline-none cat:hover:-translate-y-0.5 cat:hover:border-mid cat:focus-visible:-translate-y-0.5 cat:focus-visible:border-mid"
    >
      <span
        aria-hidden="true"
        className="cat:relative cat:aspect-video cat:overflow-hidden cat:before:absolute cat:before:inset-0 cat:before:bg-[repeating-linear-gradient(135deg,transparent_0_7px,rgba(255,255,255,.06)_7px_8px)] cat:before:content-['']"
        style={{ background: artGradient(show.hue) }}
      >
        <b className="cat:absolute cat:bottom-2 cat:left-2.5 cat:font-serif cat:text-[22px] cat:leading-none cat:font-semibold cat:text-white cat:opacity-92">
          {show.title.split(" ")[0]}
        </b>
      </span>
      <span className="cat:grid cat:gap-[3px] cat:px-[11px] cat:pt-2.5 cat:pb-3">
        <span className="cat:text-[13px] cat:font-[550] cat:text-strong">{show.title}</span>
        <span className="cat:font-mono cat:text-[11px] cat:leading-[normal] cat:text-muted">
          {show.kind} · {minutes(show.length)}
        </span>
      </span>
    </button>
  );
}
