import { Fragment, type ReactNode } from "react";
import { RenderFigure } from "../figures/RenderFigure.tsx";
import { hostOf, remoteById, type RemoteId } from "../mfe/registry.ts";
import { reload, useStore, type Load } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { Cards } from "../ui/Card.tsx";
import { cardClass } from "../ui/card-class.ts";
import { Chip } from "../ui/Chip.tsx";
import { Lesson, Prose } from "../ui/Lesson.tsx";
import { Table } from "../ui/Table.tsx";

const COMPARISON = [
  ["El HTML se arma", "en el build, en CI", "en el servidor, en cada request", "en el navegador, con JavaScript"],
  ["Datos", "los del momento del build", "frescos en cada request", "los pide el propio navegador"],
  ["Primer contenido", "muy rápido (archivo en CDN)", "rápido, depende del servidor", "después de bajar y ejecutar JS"],
  ["Costo de servidor", "casi nulo", "por cada request", "solo archivos estáticos"],
  ["SEO", "excelente", "excelente", "más difícil"],
  ["Interactividad", "necesita hidratar o islas", "necesita hidratar o islas", "total, desde el inicio"],
  ["En esta app", "Guía de programación", "Novedades en vivo", "Catálogo y reproductor"],
] as const;

export function Rendering() {
  return (
    <Lesson
      id="render"
      title="SSR, SSG y CSR en la misma página"
      kicker="Cada remote elige la forma de renderizar que mejor le queda."
    >
      <Prose>
        <p>
          La pregunta es siempre la misma: <b>¿dónde y cuándo se convierte el componente en HTML?</b> Como cada
          micro-frontend se despliega solo, cada uno puede responderla distinto. En esta página conviven las tres
          respuestas.
        </p>
      </Prose>
      <RenderFigure />
      <Table headings="plain" className="min-w-[640px]">
        <thead>
          <tr>
            <th />
            <ComparisonHeading render="SSG">Static Site Generation</ComparisonHeading>
            <ComparisonHeading render="SSR">Server-Side Rendering</ComparisonHeading>
            <ComparisonHeading render="CSR">Client-Side Rendering</ComparisonHeading>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map(([label, ...cells]) => (
            <tr key={label}>
              <th>{label}</th>
              {cells.map((cell, index) => (
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <Experiment />
    </Lesson>
  );
}

function ComparisonHeading({ render, children }: { render: "SSG" | "SSR" | "CSR"; children: string }) {
  return (
    <th>
      <Chip render={render} className="mr-1.5" /> {children}
    </th>
  );
}

function Experiment() {
  const news = useStore((s) => s.loads.news);
  const guide = useStore((s) => s.loads.guide);
  const catalog = useStore((s) => s.loads.catalog);
  return (
    <div className="mt-9">
      <h3 className="mb-1 font-serif text-2xl font-medium text-strong">Experimento: pide cada uno otra vez</h3>
      <p className="text-muted">
        Mira qué cambia y qué no. Las cabeceras vienen de la respuesta real de cada servidor.
      </p>
      <Cards columns="three">
        <ExperimentCard
          id="news"
          load={news}
          headers={[
            ["x-rendered-at", "renderizado"],
            ["x-request-id", "request"],
            ["server-timing", "server-timing"],
            ["cache-control", "caché"],
          ]}
        >
          Cada vez una hora y un id distintos: el servidor trabaja en cada request.
        </ExperimentCard>
        <ExperimentCard
          id="guide"
          load={guide}
          headers={[
            ["x-built-at", "build"],
            ["etag", "etag"],
            ["cache-control", "caché"],
          ]}
        >
          La hora del build y el ETag no cambian, y desde la segunda vez puede responder la caché del navegador.
        </ExperimentCard>
        <ExperimentCard id="catalog" load={catalog} headers={[]}>
          El servidor solo entrega JavaScript. El HTML lo crea React en tu navegador, en {catalog?.painted ?? "…"} ms
          tras la descarga.
        </ExperimentCard>
      </Cards>
    </div>
  );
}

interface ExperimentCardProps {
  id: RemoteId;
  load: Load | undefined;
  /** Cabeceras a mostrar: [nombre de la cabecera, etiqueta]. */
  headers: (readonly [header: string, label: string])[];
  children: ReactNode;
}

function ExperimentCard({ id, load, headers, children }: ExperimentCardProps) {
  const app = remoteById(id);
  const response =
    load?.status === "ready" ? `${load.ms} ms${load.cached ? " · desde caché" : ""}` : (load?.status ?? "…");
  return (
    <div className={cardClass}>
      <h3 className="mb-1.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-strong">
        <Chip render={app.render} /> {app.title}
      </h3>
      <dl className="mt-2.5 mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11.5px] [&>dd]:break-all [&>dd]:text-strong [&>dt]:text-muted">
        <Row label="respuesta">{response}</Row>
        {id === "news" && <Row label="requests">{load?.count ?? 0}</Row>}
        {headers.map(([key, label]) => (
          <Row key={key} label={label}>
            {load?.headers?.[key] ?? "—"}
          </Row>
        ))}
        {id === "catalog" && (
          <Row label="archivos">
            {load?.files ?? "—"} desde {hostOf(app.url)}
          </Row>
        )}
      </dl>
      <p className="mb-3 text-[13px]">{children}</p>
      <Button variant="outline" onClick={() => reload(id)}>
        Pedir otra vez
      </Button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Fragment>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </Fragment>
  );
}
