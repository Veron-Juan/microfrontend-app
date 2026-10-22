import type { CSSProperties, ReactNode } from "react";
import type { RenderMode } from "@mfe/contracts";
import { cx } from "../lib/cx.ts";
import { CONTRACT } from "../mfe/bus.ts";
import { useStore } from "../state/store.ts";
import { Card, Cards } from "../ui/Card.tsx";
import { cardClass } from "../ui/card-class.ts";
import { Chip } from "../ui/Chip.tsx";
import { Lesson, Prose } from "../ui/Lesson.tsx";

const [[EVENT, SHAPE]] = Object.entries(CONTRACT);
/** Los campos del evento tal como los declara el contrato ("image?" es opcional). */
const FIELDS = SHAPE.replace(/[{}]/g, "")
  .split(",")
  .map((field) => field.trim())
  .filter(Boolean);

const caption = "font-mono text-[11px] tracking-[.1em] text-muted uppercase";

export function Communication() {
  return (
    <Lesson
      id="comunicacion"
      title="Comunicación entre micro-frontends"
      kicker="Se hablan por eventos, nunca importándose entre sí."
    >
      <Prose>
        <p>
          El catálogo y la ficha son de equipos distintos. Cuando eliges un título, el catálogo <b>publica</b> un evento{" "}
          <code>{EVENT}</code> en <code>window</code>. La ficha lo <b>escucha</b> y pide a TVmaze el resto de los datos.
          Ninguno importa al otro: si mañana la ficha cambia por completo, el catálogo no se entera.
        </p>
      </Prose>
      <BusDiagram />
      <div className="my-[22px] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 max-[820px]:grid-cols-1">
        <ContractCard />
        <BusLog />
      </div>
      <Cards columns="three">
        <Card title="El contrato se versiona">
          El nombre y la forma del evento viven en <code>@mfe/contracts</code> y se versionan como una API.
        </Card>
        <Card title="Nada de estado compartido">
          Ningún remote lee el estado de otro. Cada uno es dueño del suyo y solo publica lo que pasó.
        </Card>
        <Card title="La URL también es un canal">
          Filtros y rutas pueden vivir en la URL: cualquier remote la lee sin conocer a los demás.
        </Card>
      </Cards>
    </Lesson>
  );
}

/** El recorrido de un evento por la página. Cada evento real dispara un pulso por los cables. */
function BusDiagram() {
  const last = useStore((s) => s.events.at(0));
  return (
    <figure className="my-[22px] rounded-2xl border border-line-soft bg-card p-5 shadow-lift">
      <figcaption className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className={caption}>El recorrido de un evento</span>
        {last ? (
          <span className="text-[13px] text-muted">
            último: <b className="font-medium">{last.detail.title}</b>
          </span>
        ) : (
          <a href="#demo" className="text-[13px] text-muted underline underline-offset-2 hover:text-strong">
            Elige un título en la demo y míralo pasar
          </a>
        )}
      </figcaption>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(56px,.8fr)_minmax(0,1fr)_minmax(56px,.8fr)_minmax(0,1fr)] items-start max-[720px]:grid-cols-1">
        <Node render="CSR" name="catalog" role="publica el evento" pulse={last?.key} />
        <Wire label="emit()" pulse={last?.key} delay={0.1} />
        <div className="grid justify-items-center">
          <div className="relative grid h-[76px] w-full content-center justify-items-center gap-1 rounded-xl bg-strong px-3 text-card">
            {last && (
              <span
                key={last.key}
                aria-hidden="true"
                className="pointer-events-none absolute -inset-[3px] animate-flash rounded-[15px] ring-4 ring-mid/50"
                style={{ animationDelay: "0.6s" }}
              />
            )}
            <b className="font-mono text-[15px] font-semibold text-card">window</b>
            <span className="text-[11.5px] opacity-70">el bus del navegador</span>
          </div>
          {/* El shell también escucha, solo para mostrarlo en el inspector. */}
          <span className="h-5 w-px border-l border-dashed border-mid max-[720px]:hidden" />
          <span className="flex items-center gap-1.5 rounded-full border border-dashed border-line bg-card px-2.5 py-1 text-[11.5px] text-muted max-[720px]:mt-2">
            <b className="font-mono font-medium text-text">shell</b> solo mira
          </span>
        </div>
        <Wire label="on()" pulse={last?.key} delay={0.7} />
        <Node render="CSR" name="details" role="escucha y pide los datos" pulse={last?.key} delay={1.2} />
      </div>
    </figure>
  );
}

interface NodeProps {
  render: RenderMode;
  name: string;
  role: string;
  pulse?: number;
  delay?: number;
}

function Node({ render, name, role, pulse, delay = 0 }: NodeProps) {
  return (
    <div
      data-render={render}
      className="relative grid h-[76px] content-center gap-1.5 rounded-xl border border-line-soft bg-page/60 px-4"
    >
      {pulse !== undefined && (
        <span
          key={pulse}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[3px] animate-flash rounded-[15px] ring-4 ring-(--c)/45"
          style={{ animationDelay: `${delay}s` }}
        />
      )}
      <span className="flex items-center gap-2">
        <Chip render={render} />
        <b className="font-mono text-[13.5px] font-medium">{name}</b>
      </span>
      <span className="text-[12.5px] text-muted">{role}</span>
    </div>
  );
}

/** Un cable entre dos piezas, con su nombre y el pulso que lo recorre cuando pasa un evento. */
function Wire({ label, pulse, delay }: { label: string; pulse?: number; delay: number }) {
  return (
    <div className="relative flex h-[76px] items-center max-[720px]:h-9 max-[720px]:justify-center">
      <span className="h-px flex-1 bg-line max-[720px]:hidden" />
      <span className="size-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-mid max-[720px]:hidden" />
      <span className="hidden h-full w-px bg-line max-[720px]:block" />
      <span className="absolute top-[calc(50%-22px)] left-1/2 -translate-x-1/2 font-mono text-[11px] text-muted max-[720px]:top-1/2 max-[720px]:left-[calc(50%+10px)] max-[720px]:translate-x-0 max-[720px]:-translate-y-1/2">
        {label}
      </span>
      {pulse !== undefined && (
        <span
          key={pulse}
          aria-hidden="true"
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 animate-bus-pulse rounded-full bg-csr shadow-[0_0_0_5px_color-mix(in_srgb,var(--color-csr)_22%,transparent)] max-[720px]:hidden"
          style={{ animationDelay: `${delay}s` } as CSSProperties}
        />
      )}
    </div>
  );
}

/** El contrato del evento: su nombre y sus campos, con los opcionales marcados. */
function ContractCard() {
  return (
    <div className={cx(cardClass, "grid content-start gap-3.5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={caption}>El contrato</span>
        <span className="rounded-md bg-line-soft px-2 py-0.5 font-mono text-[11px] text-text">@mfe/contracts</span>
      </div>
      <code className="w-fit rounded-lg bg-csr/12 px-2.5 py-1 text-[14px] font-medium text-csr">{EVENT}</code>
      <ul className="flex flex-wrap gap-1.5">
        {FIELDS.map((field) => {
          const optional = field.endsWith("?");
          return (
            <li
              key={field}
              className={cx(
                "rounded-md border px-2 py-0.5 font-mono text-[12px]",
                optional ? "border-dashed border-line text-muted" : "border-line-soft bg-page/70 text-strong",
              )}
            >
              {field.replace("?", "")}
              {optional && <span className="text-ssr">?</span>}
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-muted">
        Los campos con <span className="font-mono text-ssr">?</span> son opcionales: agregar uno no rompe a nadie.
        Renombrar el evento (antes era <code>mfe:play</code>) sí, y por eso el contrato pasó a la 2.0.
      </p>
    </div>
  );
}

/** Los últimos eventos que pasaron por el bus, tal como los vio el shell. */
function BusLog() {
  const events = useStore((s) => s.events);
  return (
    <div className={cx(cardClass, "grid min-h-[240px] content-start gap-3")} aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <span className={caption}>Registro del bus</span>
        <span className="font-mono text-[11px] text-muted">{events.length} eventos</span>
      </div>
      {events.length > 0 ? (
        <ol className="grid gap-1.5">
          {events.map((event) => (
            <LogEntry key={event.key} time={event.at} title={event.detail.title} image={event.detail.image}>
              {event.detail.from} → details
            </LogEntry>
          ))}
        </ol>
      ) : (
        <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-line p-6 text-center text-[13px] text-muted">
          <p>
            Todavía no pasó ningún evento.{" "}
            <a href="#demo" className="text-strong underline underline-offset-2">
              Elige un título en la demo
            </a>{" "}
            y aparecerá aquí.
          </p>
        </div>
      )}
    </div>
  );
}

function LogEntry({
  time,
  title,
  image,
  children,
}: {
  time: number;
  title: string;
  image?: string;
  children: ReactNode;
}) {
  return (
    <li className="grid animate-tag-in grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-line-soft bg-page/50 px-2.5 py-2">
      <span
        aria-hidden="true"
        className="aspect-[2/3] w-[30px] rounded-[4px] bg-line-soft bg-cover bg-center"
        style={image?.startsWith("https://") ? { backgroundImage: `url(${JSON.stringify(image)})` } : undefined}
      />
      <span className="grid min-w-0">
        <b className="truncate text-[13.5px] font-medium">{title}</b>
        <span className="font-mono text-[11px] text-muted">
          <span className="text-csr">{EVENT}</span> · {children}
        </span>
      </span>
      <span className="font-mono text-[11px] text-muted">
        {new Date(time).toLocaleTimeString("es", { hour12: false })}
      </span>
    </li>
  );
}
