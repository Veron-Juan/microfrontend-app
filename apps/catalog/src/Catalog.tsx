import React, { useState } from "react";
import { emit, type RemoteMeta, type Show } from "@mfe/contracts";

export const meta: RemoteMeta = { name: "catalog", version: "1.4.0", team: "Equipo Descubrimiento", render: "CSR" };

const SHOWS: Show[] = [
  { id: "f1", title: "Final continental", kind: "Deportes", length: 5400, hue: 210 },
  { id: "d2", title: "Andes profundos", kind: "Documental", length: 3000, hue: 150 },
  { id: "s3", title: "La frontera", kind: "Serie", length: 2700, hue: 20 },
  { id: "n4", title: "Noticiero 24", kind: "Noticias", length: 1800, hue: 280 },
  { id: "k5", title: "Taller de robots", kind: "Infantil", length: 1500, hue: 45 },
  { id: "m6", title: "Concierto en vivo", kind: "Música", length: 4200, hue: 330 },
];

// Los estilos viajan con el remote y van con prefijo "cat-" para no chocar con el shell
// ni con otros remotes (aislamiento de estilos por convención).
const CSS = `
.cat{--cat-line:var(--anatomy-faint,#2a2a2a);font-family:Inter,system-ui,sans-serif}
.cat-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;gap:12px;flex-wrap:wrap}
.cat-head h3{margin:0;font-size:15px;font-weight:600;color:var(--anatomy-strong,#e6e6e6);letter-spacing:-.01em}
.cat-filters{display:flex;gap:6px;flex-wrap:wrap}
.cat-filters button{font:11px/1 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;padding:6px 9px;border-radius:999px;border:1px solid var(--cat-line);background:transparent;color:var(--anatomy-muted,#8c8c90);cursor:pointer}
.cat-filters button[aria-pressed="true"]{color:var(--anatomy-strong,#fff);border-color:var(--anatomy-mid,#6a6a6a)}
.cat-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.cat-card{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;border:1px solid var(--cat-line);background:var(--anatomy-card,#131313);border-radius:10px;overflow:hidden;transition:transform .25s cubic-bezier(.32,.72,0,1),border-color .25s}
.cat-card:hover,.cat-card:focus-visible{transform:translateY(-2px);border-color:var(--anatomy-mid,#6a6a6a)}
.cat-art{aspect-ratio:16/9;position:relative;overflow:hidden}
.cat-art i{position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,transparent 0 7px,rgba(255,255,255,.06) 7px 8px)}
.cat-art b{position:absolute;left:10px;bottom:8px;font:600 22px/1 "EB Garamond",Georgia,serif;color:#fff;opacity:.92}
.cat-body{padding:10px 11px 12px;display:grid;gap:3px}
.cat-title{font-size:13px;font-weight:550;color:var(--anatomy-strong,#e6e6e6)}
.cat-sub{font:11px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
.cat-foot{margin-top:12px;font:11px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
`;

const minutes = (seconds: number) => Math.round(seconds / 60) + " min";

export default function Catalog() {
  const [kind, setKind] = useState("Todo");
  const [sent, setSent] = useState<string | null>(null);
  const kinds = ["Todo", ...new Set(SHOWS.map((show) => show.kind))];
  const shown = kind === "Todo" ? SHOWS : SHOWS.filter((show) => show.kind === kind);

  // Comunicación entre micro-frontends: el catálogo no conoce al reproductor.
  // Solo publica un evento del contrato compartido ("mfe:play") en el bus del navegador.
  const play = (show: Show) => {
    emit("mfe:play", { ...show, from: meta.name, at: Date.now() });
    setSent(show.title);
  };

  return (
    <section className="cat">
      <style>{CSS}</style>
      <div className="cat-head">
        <h3>Catálogo</h3>
        <div className="cat-filters">
          {kinds.map((item) => (
            <button key={item} aria-pressed={item === kind} onClick={() => setKind(item)}>{item}</button>
          ))}
        </div>
      </div>
      <div className="cat-row">
        {shown.map((show) => (
          <button className="cat-card" key={show.id} onClick={() => play(show)} aria-label={"Reproducir " + show.title}>
            <span className="cat-art" style={{ background: `linear-gradient(140deg,hsl(${show.hue} 45% 32%),hsl(${show.hue + 30} 40% 14%))` }}>
              <i /><b>{show.title.split(" ")[0]}</b>
            </span>
            <span className="cat-body">
              <span className="cat-title">{show.title}</span>
              <span className="cat-sub">{show.kind} · {minutes(show.length)}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="cat-foot">
        {sent ? `evento mfe:play enviado → "${sent}"` : "Elige un título: el catálogo emite mfe:play y el reproductor lo escucha."} · React {React.version}
      </p>
    </section>
  );
}
