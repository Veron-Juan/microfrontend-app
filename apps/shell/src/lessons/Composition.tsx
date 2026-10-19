import { REMOTES } from "../mfe/registry.ts";
import { useStore } from "../state/store.ts";
import { Card, Cards, Tag } from "../ui/Card.tsx";
import { CodeBlock } from "../ui/CodeBlock.tsx";
import { Lesson } from "../ui/Lesson.tsx";

const SNIPPET = `// apps/shell/vite.config.ts
federation({
  name: "shell",
  remotes: {
    catalog: { type: "module", entry: "http://localhost:5001/remoteEntry.js" },
    player:  { type: "module", entry: "http://localhost:5002/remoteEntry.js" },
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
})

// apps/shell/src/mfe/federation.ts
const { default: Catalog } = await loadRemote<RemoteModule>("catalog/Catalog");

// apps/shell/src/mfe/fragments.ts
const html = await fetch("http://localhost:5003/fragment/news").then((r) => r.text());`;

export function Composition() {
  return (
    <Lesson
      id="composicion"
      title="Cómo se compone"
      kicker="Hay cuatro formas de juntar los pedazos. Esta app usa dos."
    >
      <Cards columns="two">
        <Card title="En el build" aside={<Tag>paquetes npm</Tag>}>
          Cada pedazo se publica como librería y el shell lo instala. Es simple, pero cada cambio obliga a re-desplegar
          el shell: se pierde el deploy independiente.
        </Card>
        <Card title="En el navegador, en runtime" aside={<Tag active>usado aquí</Tag>}>
          Con <b>Module Federation</b> el shell descarga <code>remoteEntry.js</code> de cada remote al momento de usarlo
          y comparte React con él. Así llegan el catálogo y el reproductor.
        </Card>
        <Card title="En el servidor o el edge" aside={<Tag active>usado aquí</Tag>}>
          Cada remote devuelve <b>fragmentos de HTML</b> que se insertan en la página (SSI, ESI, o un servidor de
          composición). Así llegan Novedades y la Guía.
        </Card>
        <Card title="Iframes" aside={<Tag>aislamiento total</Tag>}>
          El aislamiento más fuerte, pero pesa más, complica el diseño responsivo, la accesibilidad y la comunicación.
        </Card>
      </Cards>
      <Waterfall />
      <CodeBlock>{SNIPPET}</CodeBlock>
    </Lesson>
  );
}

/** Cuándo empezó y terminó cada carga en esta página, en una misma línea de tiempo. */
function Waterfall() {
  const loads = useStore((s) => s.loads);
  const rows = REMOTES.flatMap((app) => {
    const load = loads[app.id];
    return load?.start != null ? [{ app, load, start: load.start }] : [];
  });
  const t0 = Math.min(...rows.map(({ start }) => start), Infinity);
  // Una carga en curso todavía no tiene fin: su barra llega hasta el final de la más larga.
  const t1 = Math.max(...rows.map(({ load, start }) => load.end ?? start), t0 + 1);
  const span = Math.max(t1 - t0, 1);

  return (
    <figure
      className="my-[22px] rounded-xl border border-line-soft bg-card px-[18px] py-4"
      aria-label="Cascada de carga de los remotes"
    >
      <figcaption className="mb-3 flex flex-wrap justify-between gap-3 font-mono text-[11px] tracking-[.06em] text-strong uppercase">
        <span>Cascada de carga · esta página</span>
        <span className="text-muted">las cuatro cargas corren en paralelo</span>
      </figcaption>
      {rows.map(({ app, load, start }) => (
        <div className="grid grid-cols-[90px_1fr_64px] items-center gap-3 py-[5px] font-mono text-xs" key={app.id}>
          <span className="text-strong">{app.name}</span>
          <span className="relative h-2.5 overflow-hidden rounded-[5px] bg-line-soft">
            <i
              data-render={app.render}
              data-status={load.status}
              className="absolute inset-y-0 rounded-[5px] bg-(--c) transition-[left,width] duration-400 ease-out-soft data-[status=error]:bg-danger data-[status=loading]:opacity-45"
              style={{
                left: `${((start - t0) / span) * 100}%`,
                width: `${Math.max(1.5, (((load.end ?? t1) - start) / span) * 100)}%`,
              }}
            />
          </span>
          <span className="text-right text-muted">
            {load.status === "ready" ? `${load.ms} ms` : load.status === "error" ? "error" : "…"}
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-muted">Esperando las primeras cargas…</p>}
    </figure>
  );
}
