import { remotes, type RemoteApp } from "../mfe/registry.ts";
import { setBroken, useStore } from "../state/store.ts";
import { Lesson, Note, Prose } from "../ui/Lesson.tsx";

export function Failures() {
  return (
    <Lesson id="fallos" title="Fallos aislados" kicker="Un remote caído no debería tumbar la página.">
      <Prose>
        <p>
          Tira un servidor. El shell apunta ese remote a un origen donde no hay nadie, la carga falla y su espacio
          muestra un aviso con un botón para reintentar. El resto sigue funcionando: los remotes de Module Federation
          están envueltos en un <em>error boundary</em> y los fragmentos en un <code>try/catch</code> del fetch.
        </p>
      </Prose>
      <div className="mt-[22px] mb-2.5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
        {remotes().map((app) => (
          <Breaker key={app.id} app={app} />
        ))}
      </div>
      <Note>Mira la demo y la Fig 1 mientras lo haces: su pieza se queda arriba y las demás siguen en su lugar.</Note>
    </Lesson>
  );
}

/** Un interruptor por remote, como los de un tablero eléctrico. */
function Breaker({ app }: { app: RemoteApp }) {
  const broken = useStore((s) => !!s.broken[app.id]);
  const status = useStore((s) => s.loads[app.id]?.status ?? "idle");
  const label = broken ? "caído · clic para levantar" : status === "ready" ? "en línea · clic para tirar" : "cargando…";
  return (
    <button
      type="button"
      aria-pressed={broken}
      onClick={() => setBroken(app.id, !broken)}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3 text-left text-[13px] text-strong hover:border-mid aria-pressed:border-danger/60"
    >
      <i
        data-render={app.render}
        data-status={status}
        className="size-3 flex-none rounded-full bg-(--c) ring-3 ring-(--c)/20 transition-all duration-300 data-[status=error]:bg-transparent data-[status=error]:ring-0 data-[status=error]:inset-ring-[1.5px] data-[status=error]:inset-ring-danger data-[status=loading]:opacity-40"
      />
      <span className="grid">
        <b className="font-mono text-[13px] font-medium">{app.name}</b>
        <small className="text-xs text-muted">{label}</small>
      </span>
    </button>
  );
}
