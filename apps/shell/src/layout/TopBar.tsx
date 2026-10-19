import { LiveCount } from "../inspector/LiveCount.tsx";
import { Slot } from "../inspector/Slot.tsx";
import { toggleInspector, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import type { Theme } from "./use-theme.ts";

interface TopBarProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const inspector = useStore((s) => s.inspector);
  return (
    <Slot id="shell" tools={false} tag="below" sticky>
      <header className="flex items-center justify-between gap-4 border-b border-line-soft bg-page/82 px-[max(16px,calc((100vw-1180px)/2))] py-3 backdrop-blur-[10px] max-[560px]:gap-2">
        <a className="flex items-center gap-2.5 font-mono text-sm font-medium text-strong" href="#top">
          <BrandMark />
          <span className="max-[560px]:hidden">
            mfe<i className="mx-0.5 text-muted not-italic">/</i>anatomía
          </span>
        </a>
        <div className="flex items-center gap-2.5">
          <LiveCount />
          <Button
            role="switch"
            aria-checked={inspector}
            onClick={toggleInspector}
            className="group max-[560px]:px-2.5 max-[560px]:py-1.5"
          >
            <span className="relative h-[15px] w-[26px] rounded-full bg-line transition-colors duration-250 group-aria-checked:bg-strong">
              <span className="absolute top-0.5 left-0.5 size-[11px] rounded-full bg-card shadow-[0_1px_2px_#0003] transition-transform duration-250 ease-out-soft group-aria-checked:translate-x-[11px]" />
            </span>
            Inspector <kbd className="max-[560px]:hidden">I</kbd>
          </Button>
          <Button onClick={onToggleTheme} aria-label="Cambiar tema" className="max-[560px]:px-2.5 max-[560px]:py-1.5">
            {theme === "dark" ? "Claro" : "Oscuro"}
          </Button>
        </div>
      </header>
    </Slot>
  );
}

/** Cuatro módulos en un chasis, en miniatura. */
function BrandMark() {
  const module = "fill-(--c) stroke-none opacity-90";
  return (
    <svg className="size-[22px]" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="3" width="19" height="3" rx="1" className="fill-none stroke-strong stroke-[1.1]" />
      <rect x="3.5" y="8" width="3.4" height="12" rx="0.8" data-render="SSR" className={module} />
      <rect x="8.2" y="8" width="3.4" height="12" rx="0.8" data-render="CSR" className={module} />
      <rect x="12.9" y="8" width="3.4" height="12" rx="0.8" data-render="CSR" className={module} />
      <rect x="17.6" y="8" width="3.4" height="12" rx="0.8" data-render="SSG" className={module} />
    </svg>
  );
}
