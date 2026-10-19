import { REMOTES } from "../mfe/registry.ts";
import { useStore } from "../state/store.ts";

/** Un punto por remote, del color de su render, que se enciende cuando terminó de cargar. */
export function LiveCount() {
  const loads = useStore((s) => s.loads);
  const ready = REMOTES.filter((app) => loads[app.id]?.status === "ready").length;
  return (
    <span
      className="mr-1.5 flex items-center gap-1 font-mono text-xs text-muted max-[900px]:hidden"
      title="Remotes cargados en esta página"
    >
      {REMOTES.map((app) => (
        <i
          key={app.id}
          data-render={app.render}
          data-status={loads[app.id]?.status ?? "idle"}
          className="size-[7px] rounded-[2px] bg-line transition-colors duration-300 last-of-type:mr-1 data-[status=error]:bg-transparent data-[status=error]:inset-ring data-[status=error]:inset-ring-danger data-[status=ready]:bg-(--c)"
        />
      ))}
      {ready}/{REMOTES.length}
    </span>
  );
}
