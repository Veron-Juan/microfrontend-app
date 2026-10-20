import { Slot } from "../inspector/Slot.tsx";
import { cx } from "../lib/cx.ts";
import { Remote } from "../mfe/Remote.tsx";
import { apps, hostOf } from "../mfe/registry.ts";
import { toggleInspector, useStore, type Load } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
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
  const inspector = useStore((s) => s.inspector);
  return (
    <div className="my-[22px] overflow-hidden rounded-[14px] border border-line bg-card shadow-lift">
      <div className="flex items-center gap-3 border-b border-line-soft px-3 py-[9px]">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="size-[9px] rounded-full bg-line" />
          <i className="size-[9px] rounded-full bg-line" />
          <i className="size-[9px] rounded-full bg-line" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-line-soft px-2.5 py-1 font-mono text-xs text-muted">
          localhost:5000/inicio
        </span>
        <Button variant="mini" onClick={toggleInspector}>
          {inspector ? "inspector: on" : "inspector: off"}
        </Button>
      </div>
      <div className="grid gap-3.5 p-3.5">
        <Slot id="shell" tools={false} tag="corner" className="p-3.5">
          <nav className="flex flex-wrap items-center gap-[18px] px-1 py-0.5 text-[13px] text-muted">
            <b className="mr-2 font-serif text-[17px] font-semibold">Pantalla</b>
            <span>Inicio</span>
            <span>En vivo</span>
            <span>Series</span>
            <span>Deportes</span>
            <i
              className={cx(
                "ml-auto size-6 rounded-full bg-linear-135 from-csr to-ssg",
                inspector && "min-[561px]:mr-[220px]",
              )}
            />
          </nav>
        </Slot>
        <Slot id="news" className="p-3.5">
          <Remote id="news" />
        </Slot>
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3.5 max-[820px]:grid-cols-1">
          <Slot id="catalog" className="p-3.5">
            <Remote id="catalog" />
          </Slot>
          <Slot id="player" className="p-3.5">
            <Remote id="player" />
          </Slot>
        </div>
        <Slot id="guide" className="p-3.5">
          <Remote id="guide" />
        </Slot>
      </div>
    </div>
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
