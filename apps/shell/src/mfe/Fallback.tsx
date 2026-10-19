import { errorMessage } from "../lib/errors.ts";
import { reload } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import type { RemoteApp } from "./registry.ts";

/** Lo que se ve en el lugar de un remote que no cargó. El resto de la página sigue igual. */
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
        <strong className="text-sm">{app.title} no está disponible</strong>
        <p className="mt-0.5 mb-1.5 text-[13px]">
          El shell y el resto de la página siguen funcionando. Esto es el <em>aislamiento de fallos</em>: cada remote
          cae solo.
        </p>
        <code className="text-[11px] break-all">{errorMessage(error).slice(0, 140)}</code>
      </div>
      <Button variant="outline" className="bg-card" onClick={() => reload(app.id)}>
        Reintentar
      </Button>
    </div>
  );
}
