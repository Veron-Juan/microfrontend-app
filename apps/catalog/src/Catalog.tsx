import { useState, version } from "react";
import { emit, type RemoteMeta, type Show } from "@mfe/contracts";
import styles from "./catalog.css?inline";
import { FilterChips } from "./FilterChips.tsx";
import { ShowCard } from "./ShowCard.tsx";
import { ALL, filterByKind, kindsOf } from "./shows.ts";
import { TVMAZE_SITE } from "./tvmaze.ts";
import { useShows, type ShowsStatus } from "./use-shows.ts";

export const meta: RemoteMeta = { name: "catalog", version: "2.1.0", team: "Equipo Descubrimiento", render: "CSR" };

const STATUS: Record<ShowsStatus, string> = {
  loading: "pidiendo datos a TVmaze desde tu navegador…",
  ready: "",
  fallback: "TVmaze no respondió: este es el catálogo de respaldo.",
  error: "TVmaze no respondió. Prueba de nuevo en un momento.",
};

export default function Catalog() {
  const [text, setText] = useState("");
  const [kind, setKind] = useState(ALL);
  const [selected, setSelected] = useState<Show | null>(null);
  const { shows, status } = useShows(text);
  const kinds = kindsOf(shows);
  // Si el filtro elegido no existe en los resultados nuevos, se muestra todo.
  const active = kinds.includes(kind) ? kind : ALL;
  const shown = filterByKind(shows, active);

  // Comunicación entre micro-frontends: el catálogo no conoce a la ficha.
  // Solo publica un evento del contrato compartido ("mfe:select") en el bus del navegador.
  const select = (show: Show) => {
    emit("mfe:select", { ...show, from: meta.name, at: Date.now() });
    setSelected(show);
  };

  return (
    <section className="cat:grid cat:gap-3.5 cat:font-sans">
      {/* El CSS compilado viaja dentro del módulo remoto: funciona igual en el shell y en standalone. */}
      <style>{styles}</style>
      <header className="cat:flex cat:min-h-8 cat:flex-wrap cat:items-center cat:justify-between cat:gap-x-3 cat:gap-y-2">
        <h3 className="cat:m-0 cat:text-[15px] cat:font-semibold cat:tracking-[-.01em] cat:text-strong">Catálogo</h3>
        <label className="cat:relative cat:block cat:w-56 cat:max-w-full">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="cat:pointer-events-none cat:absolute cat:top-1/2 cat:left-3 cat:size-3.5 cat:-translate-y-1/2 cat:text-muted"
          >
            <circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Buscar en TVmaze…"
            aria-label="Buscar programas"
            className="cat:box-border cat:h-8 cat:w-full cat:rounded-full cat:border cat:border-faint cat:bg-page/60 cat:pr-3 cat:pl-8 cat:font-sans cat:text-[13px] cat:text-strong cat:transition-colors cat:outline-none cat:placeholder:text-muted cat:focus-visible:border-mid cat:focus-visible:bg-card"
          />
        </label>
      </header>
      {kinds.length > 2 && <FilterChips options={kinds} selected={active} onSelect={setKind} />}
      <div
        aria-busy={status === "loading"}
        className="cat:grid cat:grid-cols-[repeat(auto-fill,minmax(112px,1fr))] cat:gap-x-3 cat:gap-y-4 cat:transition-opacity cat:aria-busy:opacity-60"
      >
        {shown.map((show) => (
          <ShowCard key={show.id} show={show} selected={show.id === selected?.id} onSelect={select} />
        ))}
      </div>
      {status === "ready" && shows.length === 0 && (
        <p className="cat:my-6 cat:text-center cat:text-[13px] cat:text-muted">Sin resultados para “{text.trim()}”.</p>
      )}
      <p
        aria-live="polite"
        className="cat:m-0 cat:border-t cat:border-faint cat:pt-3 cat:font-mono cat:text-[11px] cat:leading-[normal] cat:text-muted"
      >
        {STATUS[status] ||
          (selected
            ? `evento mfe:select enviado → "${selected.title}"`
            : "Elige un título: el catálogo emite mfe:select y la ficha lo escucha.")}{" "}
        · datos:{" "}
        <a href={TVMAZE_SITE} className="cat:text-text cat:underline cat:underline-offset-2">
          TVmaze
        </a>{" "}
        · React {version}
      </p>
    </section>
  );
}
