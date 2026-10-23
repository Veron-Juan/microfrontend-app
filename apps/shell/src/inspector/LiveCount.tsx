import { remotes } from "../mfe/registry.ts";
import { useStore } from "../state/store.ts";

/** One dot per remote, in its render color, that lights up once it has finished loading. */
export function LiveCount() {
  const loads = useStore((s) => s.loads);
  const all = remotes();
  const ready = all.filter((app) => loads[app.id]?.status === "ready").length;
  return (
    <span
      className="mr-1.5 flex items-center gap-1 font-mono text-xs text-muted max-[900px]:hidden"
      title="Remotes loaded on this page"
    >
      {all.map((app) => (
        <i
          key={app.id}
          data-render={app.render}
          data-status={loads[app.id]?.status ?? "idle"}
          className="size-[7px] rounded-[2px] bg-line transition-colors duration-300 last-of-type:mr-1 data-[status=error]:bg-transparent data-[status=error]:inset-ring data-[status=error]:inset-ring-danger data-[status=ready]:bg-(--c)"
        />
      ))}
      {ready}/{all.length}
    </span>
  );
}
