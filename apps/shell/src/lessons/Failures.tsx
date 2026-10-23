import { remotes, type RemoteApp } from "../mfe/registry.ts";
import { setBroken, useStore } from "../state/store.ts";
import { Lesson, Note, Prose } from "../ui/Lesson.tsx";

export function Failures() {
  return (
    <Lesson id="failures" title="Isolated failures" kicker="A remote going down shouldn't take the page with it.">
      <Prose>
        <p>
          Kill a server. The shell points that remote at an origin that doesn't exist, the load fails and its space
          shows a notice with a retry button. The rest keeps working because each piece handles its own errors: if the
          download fails (of the module or the fragment), the shell catches that promise's rejection; if a Module
          Federation remote fails while rendering, an <em>error boundary</em> catches it.
        </p>
      </Prose>
      <div className="mt-[22px] mb-2.5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
        {remotes().map((app) => (
          <Breaker key={app.id} app={app} />
        ))}
      </div>
      <Note>Watch the demo and Fig 1 while you do it: its piece stays up top and the others stay in place.</Note>
    </Lesson>
  );
}

/** One switch per remote, like the breakers in an electrical panel. */
function Breaker({ app }: { app: RemoteApp }) {
  const broken = useStore((s) => !!s.broken[app.id]);
  const status = useStore((s) => s.loads[app.id]?.status ?? "idle");
  const label = broken ? "down · click to restore" : status === "ready" ? "online · click to kill" : "loading…";
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
