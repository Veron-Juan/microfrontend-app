import { useState, version } from "react";
import { emit, type RemoteMeta, type Show } from "@mfe/contracts";
import styles from "./catalog.css?inline";
import { FilterChips } from "./FilterChips.tsx";
import { ShowCard } from "./ShowCard.tsx";
import { ALL, SHOWS, filterByKind, kindsOf } from "./shows.ts";

export const meta: RemoteMeta = { name: "catalog", version: "1.4.0", team: "Equipo Descubrimiento", render: "CSR" };

const KINDS = kindsOf(SHOWS);

export default function Catalog() {
  const [kind, setKind] = useState(ALL);
  const [sent, setSent] = useState<string | null>(null);
  const shown = filterByKind(SHOWS, kind);

  // Comunicación entre micro-frontends: el catálogo no conoce al reproductor.
  // Solo publica un evento del contrato compartido ("mfe:play") en el bus del navegador.
  const play = (show: Show) => {
    emit("mfe:play", { ...show, from: meta.name, at: Date.now() });
    setSent(show.title);
  };

  return (
    <section className="cat:font-sans">
      {/* El CSS compilado viaja dentro del módulo remoto: funciona igual en el shell y en standalone. */}
      <style>{styles}</style>
      <div className="cat:mb-3.5 cat:flex cat:flex-wrap cat:items-baseline cat:justify-between cat:gap-3">
        <h3 className="cat:m-0 cat:text-[15px] cat:font-semibold cat:tracking-[-.01em] cat:text-strong">Catálogo</h3>
        <FilterChips options={KINDS} selected={kind} onSelect={setKind} />
      </div>
      <div className="cat:grid cat:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] cat:gap-3">
        {shown.map((show) => (
          <ShowCard key={show.id} show={show} onPlay={play} />
        ))}
      </div>
      <p aria-live="polite" className="cat:mt-3 cat:font-mono cat:text-[11px] cat:leading-[normal] cat:text-muted">
        {sent
          ? `evento mfe:play enviado → "${sent}"`
          : "Elige un título: el catálogo emite mfe:play y el reproductor lo escucha."}{" "}
        · React {version}
      </p>
    </section>
  );
}
