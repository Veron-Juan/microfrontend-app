import { errorMessage } from "../lib/errors.ts";
import { reload } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import type { RemoteApp } from "./registry.ts";

/** What shows in place of a remote that didn't load. The rest of the page stays the same. */
export function Fallback({ app, error }: { app: RemoteApp; error: unknown }) {
  return (
    <div
      role="status"
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-[10px] border border-dashed border-danger/60 bg-danger/5 p-3.5 max-[560px]:grid-cols-1"
    >
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-full border border-current font-mono text-base text-danger"
      >
        ×
      </span>
      <div>
        <strong className="text-sm">{app.title} is unavailable</strong>
        <p className="mt-0.5 mb-1.5 text-[13px]">
          The shell and the rest of the page keep working. This is <em>failure isolation</em>: each remote goes down on
          its own.
        </p>
        <code className="text-[11px] break-all">{errorMessage(error).slice(0, 140)}</code>
      </div>
      <Button variant="outline" className="bg-card" onClick={() => reload(app.id)}>
        Retry
      </Button>
    </div>
  );
}
