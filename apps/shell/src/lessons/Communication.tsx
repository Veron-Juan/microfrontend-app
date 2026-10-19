import { CONTRACT } from "../mfe/bus.ts";
import { useStore } from "../state/store.ts";
import { CodeBlock } from "../ui/CodeBlock.tsx";
import { Lesson, Prose, Rules } from "../ui/Lesson.tsx";

const contractText = Object.entries(CONTRACT)
  .map(([name, shape]) => `"${name}": ${shape}`)
  .join("\n");

export function Communication() {
  return (
    <Lesson
      id="comunicacion"
      title="Comunicación entre micro-frontends"
      kicker="Se hablan por eventos, nunca importándose entre sí."
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-7 max-[820px]:grid-cols-1">
        <Prose>
          <p>
            El catálogo y el reproductor son de equipos distintos. Cuando eliges un título, el catálogo <b>publica</b>{" "}
            un evento <code>mfe:play</code> en <code>window</code>. El reproductor lo <b>escucha</b>. Ninguno importa al
            otro: si mañana el reproductor cambia por completo, el catálogo no se entera.
          </p>
          <Rules>
            <li>El contrato (nombre y forma del evento) se versiona como una API, en el paquete @mfe/contracts.</li>
            <li>No hay estado global compartido entre remotes. Cada uno es dueño del suyo.</li>
            <li>La URL también es un canal: filtros y rutas viven en ella.</li>
          </Rules>
          <CodeBlock>{contractText}</CodeBlock>
        </Prose>
        <BusLog />
      </div>
    </Lesson>
  );
}

/** Los últimos eventos que pasaron por el bus, tal como los vio el shell. */
function BusLog() {
  const events = useStore((s) => s.events);
  return (
    <div className="min-h-[220px] rounded-xl border border-line-soft bg-card px-4 py-3.5" aria-live="polite">
      <div className="flex flex-wrap justify-between gap-3 border-b border-line-soft pb-2.5 font-mono text-[11px] tracking-[.06em] text-strong uppercase">
        <span>bus · window</span>
        <span className="text-muted">elige algo en el catálogo de la demo</span>
      </div>
      {events.length > 0 ? (
        <ol>
          {events.map((event) => (
            <li
              key={event.key}
              className="grid animate-tag-in grid-cols-[auto_auto_1fr] gap-x-3 gap-y-0.5 border-b border-line-soft py-[9px] text-[13px]"
            >
              <span className="font-mono text-[0.86em] text-muted">
                {new Date(event.at).toLocaleTimeString("es", { hour12: false })}
              </span>
              <b className="font-mono text-[0.86em] font-medium text-csr">{event.name}</b>
              <span>{event.detail.from} → player</span>
              <span className="col-start-3 text-muted">{event.detail.title}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pt-3 text-muted">Sin eventos todavía.</p>
      )}
    </div>
  );
}
