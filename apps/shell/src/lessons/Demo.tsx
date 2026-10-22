import { InspectorSwitch } from "../inspector/InspectorSwitch.tsx";
import { Slot } from "../inspector/Slot.tsx";
import { Remote } from "../mfe/Remote.tsx";
import { apps, hostOf } from "../mfe/registry.ts";
import { useStore, type Load } from "../state/store.ts";
import { Chip } from "../ui/Chip.tsx";
import { Lesson, Prose } from "../ui/Lesson.tsx";
import { Table } from "../ui/Table.tsx";

export function Demo() {
  return (
    <Lesson id="demo" title="La demo en vivo" kicker="Una pantalla de inicio de streaming, armada con cuatro remotes.">
      <Prose>
        <p>
          Enciende el <b>inspector</b> y cada pieza muestra su borde, quién la sirve, desde qué origen y cuánto tardó.
          Con <b>↻</b> la vuelves a pedir y con <b>tirar</b> simulas que su servidor se cae.
        </p>
      </Prose>
      <BrowserWindow />
      <AppsTable />
    </Lesson>
  );
}

/** Una ventana de navegador falsa donde el shell compone los cuatro remotes. */
function BrowserWindow() {
  return (
    <div className="my-[22px] overflow-hidden rounded-2xl border border-line bg-card shadow-lift">
      <div className="flex items-center gap-3 border-b border-line-soft bg-page/50 px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <i className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <i className="size-2.5 rounded-full bg-[#28c840]/80" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line-soft bg-card px-3 py-1.5 font-mono text-xs text-muted">
          <svg viewBox="0 0 16 16" className="size-3 shrink-0" aria-hidden="true">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="currentColor" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="truncate">
            localhost:5000<span className="text-strong">/inicio</span>
          </span>
        </span>
        <InspectorSwitch variant="mini" hotkey={false} />
      </div>
      <div className="grid gap-4 p-4">
        <Slot id="shell" tools={false} tag="end" panel className="px-4 py-3">
          <AppNav />
        </Slot>
        <Slot id="news" panel className="p-4">
          <Remote id="news" />
        </Slot>
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 max-[820px]:grid-cols-1">
          <Slot id="catalog" panel className="p-4">
            <Remote id="catalog" />
          </Slot>
          <Slot id="details" panel className="grid p-4">
            <Remote id="details" />
          </Slot>
        </div>
        <Slot id="guide" panel className="p-4">
          <Remote id="guide" />
        </Slot>
      </div>
    </div>
  );
}

/** La barra de la app de streaming. Es del shell: no la sirve ningún remote. */
function AppNav() {
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
      <b className="flex items-center gap-2 font-serif text-[19px] font-semibold tracking-[-.01em] text-strong">
        <i className="grid size-6 place-items-center rounded-md bg-strong not-italic" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="size-3 fill-card">
            <path d="M5 3.5v9l7.5-4.5z" />
          </svg>
        </i>
        Pantalla
      </b>
      <span className="flex flex-wrap gap-x-5 gap-y-1">
        <span className="relative font-medium text-strong after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-strong">
          Inicio
        </span>
        <span>En vivo</span>
        <span>Series</span>
        <span>Deportes</span>
      </span>
      <span className="ml-auto flex items-center gap-3">
        <svg viewBox="0 0 16 16" className="size-4 text-muted" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <i className="size-7 rounded-full bg-linear-135 from-csr via-ssr to-ssg" aria-hidden="true" />
      </span>
    </nav>
  );
}

const SHELL_LOAD: Load = { status: "ready" };

function AppsTable() {
  const loads = useStore((s) => s.loads);
  return (
    <Table>
      <thead>
        <tr>
          <th>App</th>
          <th>Equipo</th>
          <th>Render</th>
          <th>Composición</th>
          <th>Origen</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {apps().map((app) => {
          const load = app.kind === "host" ? SHELL_LOAD : loads[app.id];
          return (
            <tr key={app.id}>
              <td>
                <b className="font-mono text-[13px] font-medium">{app.name}</b>{" "}
                <span className="text-muted">@{load?.meta?.version ?? app.version}</span>
              </td>
              <td>{app.team}</td>
              <td>
                <Chip render={app.render} />
              </td>
              <td>{app.composition}</td>
              <td className="font-mono text-[0.86em]">{hostOf(app.url)}</td>
              <td
                className="font-mono text-[0.86em] data-[status=error]:text-danger data-[status=ready]:text-strong"
                data-status={load?.status ?? "idle"}
              >
                {statusText(load, app.kind === "host")}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function statusText(load: Load | undefined, isHost: boolean) {
  if (isHost) return "host";
  if (load?.status === "ready") return `${load.ms} ms`;
  if (load?.status === "error") return "caído";
  return "cargando…";
}
