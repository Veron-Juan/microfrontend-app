import { cx } from "../lib/cx.ts";
import { remotes } from "../mfe/registry.ts";
import { useStore } from "../state/store.ts";
import { Card, Cards, Tag } from "../ui/Card.tsx";
import { Chip } from "../ui/Chip.tsx";
import { Code } from "../ui/Code.tsx";
import { Lesson } from "../ui/Lesson.tsx";

/** Las tres llamadas que arman la página, en el orden en que ocurren. */
const STEPS = [
  {
    title: "Saber dónde vive cada remote",
    file: "apps/shell/public/remotes.json",
    text: "El discovery: un archivo por entorno. Publicar o revertir un remote es cambiar su entrada, sin tocar el shell.",
    code: `"catalog": {
  "type": "module-federation",
  "url": "http://localhost:5001/mf-manifest.json",
  "module": "./Catalog"
}`,
  },
  {
    title: "Cargar un remote con Module Federation",
    file: "apps/shell/src/mfe/federation.ts",
    text: "El shell registra el manifiesto y baja el código recién cuando lo va a montar. React viene compartido.",
    code: `registerRemotes([{ name: "catalog", entry: "http://localhost:5001/mf-manifest.json" }]);
const { default: Catalog } = await loadRemote("catalog/Catalog");`,
  },
  {
    title: "Pedir un fragmento de HTML",
    file: "apps/shell/src/mfe/fragments.ts",
    text: "Para SSR y SSG el shell pide HTML ya renderizado y lo inserta tal cual. No corre JavaScript del remote.",
    code: `const response = await fetch("http://localhost:5003/fragment/news");
const html = await response.text();`,
  },
] as const;

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
          Con <b>Module Federation</b> el shell lee el <code>mf-manifest.json</code> de cada remote, descarga su código
          al momento de usarlo y comparte React con él. Así llegan el catálogo y la ficha.
        </Card>
        <Card title="En el servidor o el edge" aside={<Tag active>usado aquí</Tag>}>
          Cada remote devuelve <b>fragmentos de HTML</b> que se insertan en la página (SSI, ESI, o un servidor de
          composición). Así llegan Novedades y la Guía.
        </Card>
        <Card title="Iframes" aside={<Tag>aislamiento total</Tag>}>
          El aislamiento más fuerte, pero pesa más, complica el diseño responsivo, la accesibilidad y la comunicación.
        </Card>
      </Cards>
      <LoadTimeline />
      <Steps />
    </Lesson>
  );
}

/** Marcas del eje de tiempo: valores redondos, como mucho cinco, entre 0 y el total. */
function ticks(total: number): number[] {
  const step = [10, 25, 50, 100, 250, 500, 1000, 2000].find((size) => total / size <= 5) ?? 5000;
  return Array.from({ length: Math.floor(total / step) + 1 }, (_, index) => index * step);
}

const LABEL_COLUMN = "grid-cols-[150px_minmax(0,1fr)] max-[560px]:grid-cols-[96px_minmax(0,1fr)]";

/** Cuándo empezó y terminó cada carga en esta página, en una misma línea de tiempo. */
function LoadTimeline() {
  const loads = useStore((s) => s.loads);
  const rows = remotes().flatMap((app) => {
    const load = loads[app.id];
    return load?.start != null ? [{ app, load, start: load.start }] : [];
  });
  const t0 = Math.min(...rows.map(({ start }) => start), Infinity);
  // Una carga en curso todavía no tiene fin: su barra llega hasta el final de la más larga.
  const t1 = Math.max(...rows.map(({ load, start }) => load.end ?? start), t0 + 1);
  const span = Math.max(t1 - t0, 1);
  const done = rows.length > 0 && rows.every(({ load }) => load.status !== "loading");
  const sequential = rows.reduce((sum, { load }) => sum + (load.ms ?? 0), 0);

  return (
    <figure
      className="my-[22px] overflow-hidden rounded-2xl border border-line-soft bg-card shadow-lift"
      aria-label="Cascada de carga de los remotes"
    >
      <figcaption className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line-soft px-5 pt-4 pb-3.5">
        <div>
          <p className="font-mono text-[11px] tracking-[.1em] text-muted uppercase">Cascada de carga · esta página</p>
          <p className="mt-1 text-[15px] font-semibold text-strong">Las cuatro cargas corren a la vez</p>
        </div>
        {done && (
          <dl className="flex gap-2 font-mono text-[11px]">
            <div className="rounded-lg bg-strong px-3 py-1.5 text-card">
              <dt className="opacity-70">en paralelo</dt>
              <dd className="text-[15px] font-semibold">{Math.round(span)} ms</dd>
            </div>
            <div className="rounded-lg border border-line px-3 py-1.5 text-muted">
              <dt>una tras otra</dt>
              <dd className="text-[15px] font-semibold text-text line-through decoration-1">{sequential} ms</dd>
            </div>
          </dl>
        )}
      </figcaption>

      <div className="px-5 pt-3 pb-4">
        <div className={cx("grid gap-4", LABEL_COLUMN)}>
          <span />
          <div className="relative h-5 font-mono text-[10px] text-muted">
            {ticks(span).map((ms) => (
              <span
                key={ms}
                className="absolute top-0 -translate-x-1/2 first:translate-x-0"
                style={{ left: `${(ms / span) * 100}%` }}
              >
                {ms} ms
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-2.5">
          {rows.map(({ app, load, start }) => {
            const left = ((start - t0) / span) * 100;
            const end = left + (((load.end ?? t1) - start) / span) * 100;
            // La duración va a la derecha de la barra; si no entra, adentro y en blanco.
            const inside = end > 82;
            return (
              <div key={app.id} className={cx("grid items-center gap-4", LABEL_COLUMN)}>
                <span className="flex min-w-0 items-center gap-2">
                  <Chip render={app.render} />
                  <b className="truncate font-mono text-[12.5px] font-medium">{app.name}</b>
                </span>
                <span className="relative h-7 rounded-md bg-page/70 bg-[repeating-linear-gradient(90deg,var(--color-line-soft)_0_1px,transparent_1px_12.5%)]">
                  <span
                    data-render={app.render}
                    data-status={load.status}
                    className="absolute inset-y-1 min-w-1.5 rounded-[5px] bg-linear-90 from-(--c)/70 to-(--c) shadow-[0_2px_10px_-3px_var(--c)] transition-[left,width] duration-500 ease-out-soft data-[status=error]:from-danger/70 data-[status=error]:to-danger data-[status=loading]:animate-pulse"
                    style={{ left: `${left}%`, width: `${end - left}%` }}
                  />
                  <span
                    className={cx(
                      "absolute top-1/2 -translate-y-1/2 font-mono text-[11px] font-medium whitespace-nowrap",
                      inside ? "pr-2 text-white" : "pl-2 text-strong",
                    )}
                    style={inside ? { right: `${100 - end}%` } : { left: `${end}%` }}
                  >
                    {load.status === "ready" ? `${load.ms} ms` : load.status === "error" ? "error" : "cargando…"}
                  </span>
                </span>
              </div>
            );
          })}
          {rows.length === 0 && <p className="py-3 text-sm text-muted">Esperando las primeras cargas…</p>}
        </div>
        <p className="mt-3.5 text-[13px] text-muted">
          Cada remote se pide por su lado, así que la página tarda lo que tarda el más lento, no la suma de todos.
        </p>
      </div>
    </figure>
  );
}

/** Las tres llamadas que componen la página, como una secuencia numerada. */
function Steps() {
  return (
    <div className="my-[22px]">
      <p className="mb-3 font-mono text-[11px] tracking-[.1em] text-muted uppercase">El código, en tres pasos</p>
      <ol className="grid gap-3">
        {STEPS.map((step, index) => (
          <li
            key={step.file}
            className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-4 not-last:after:absolute not-last:after:top-[52px] not-last:after:-bottom-3 not-last:after:left-[17px] not-last:after:w-px not-last:after:bg-line max-[560px]:gap-3"
          >
            <span className="z-[1] mt-4 grid size-9 place-items-center rounded-full border border-line bg-card font-mono text-[13px] font-semibold text-strong shadow-lift">
              {index + 1}
            </span>
            <div className="overflow-hidden rounded-xl border border-line-soft bg-card shadow-lift">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 pt-3.5 pb-1.5">
                <b className="text-[14px] font-semibold text-strong">{step.title}</b>
                <span className="rounded-md bg-line-soft px-2 py-0.5 font-mono text-[11px] text-text">{step.file}</span>
              </div>
              <p className="px-4 pb-3 text-[13.5px] text-text">{step.text}</p>
              <Code className="border-t border-line-soft bg-page/60 px-4 py-3">{step.code}</Code>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
