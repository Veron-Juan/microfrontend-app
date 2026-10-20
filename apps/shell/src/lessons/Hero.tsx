import { apps, environment, hostOf } from "../mfe/registry.ts";
import { toggleInspector, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { buttonClass } from "../ui/button-class.ts";
import { Chip } from "../ui/Chip.tsx";

const DOT_GRID =
  "before:pointer-events-none before:absolute before:inset-y-0 before:-inset-x-10 before:z-0 before:bg-[radial-gradient(var(--mfe-mid)_1px,transparent_1px)] before:bg-size-[18px_18px] before:opacity-20 before:[mask-image:linear-gradient(180deg,#000_10%,transparent_90%)] before:content-['']";

export function Hero() {
  const inspector = useStore((s) => s.inspector);
  return (
    <section className={`relative pt-[72px] pb-10 *:relative ${DOT_GRID}`}>
      {environment() === "preview" && <PreviewNote />}
      <p className="mb-3.5 font-mono text-xs tracking-[.12em] text-muted uppercase">
        Una lección que es su propio ejemplo
      </p>
      <h1 className="mb-[22px] font-serif text-[clamp(40px,7vw,78px)]/[.98] font-medium tracking-[-.02em] text-strong">
        Anatomía de un micro-frontend
      </h1>
      <p className="mb-7 max-w-[640px] font-serif text-[clamp(19px,2.2vw,23px)]/[1.45] text-text [&_b]:font-medium">
        Esta página está hecha de <b>cinco aplicaciones independientes</b>. Cada una tiene su propio código, su propio
        servidor, su propia versión y su propia forma de renderizar. Lo que ves parece una sola app porque un{" "}
        <em>shell</em> las compone en vivo.
      </p>
      <div className="mb-9 flex flex-wrap gap-2.5">
        <Button variant="primary" onClick={toggleInspector}>
          {inspector ? "Apagar el inspector" : "Encender el inspector"}
        </Button>
        <a className={buttonClass("pill")} href="#demo">
          Ir a la demo
        </a>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
        {apps().map((app) => (
          <li
            key={app.id}
            className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-0.5 rounded-[10px] border border-line-soft bg-card px-3 py-2.5"
          >
            <Chip render={app.render} />
            <b className="font-mono text-[13px] font-medium">{app.name}</b>
            <span className="col-start-2 font-mono text-[11px] text-muted">{hostOf(app.url)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PreviewNote() {
  return (
    <p className="mb-7 max-w-[680px] rounded-[10px] border border-ssr/50 bg-ssr/8 px-3.5 py-3 text-sm">
      <b>Vista previa estática.</b> Aquí no corre el servidor SSR, así que Novedades muestra una instantánea que ese
      servidor renderizó antes de publicar. Catálogo, reproductor y guía son los builds reales. Para ver el SSR en vivo,
      corre <code>npm run dev</code> en tu máquina.
    </p>
  );
}
