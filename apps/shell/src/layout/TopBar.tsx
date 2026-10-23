import { InspectorSwitch } from "../inspector/InspectorSwitch.tsx";
import { LiveCount } from "../inspector/LiveCount.tsx";
import { Slot } from "../inspector/Slot.tsx";
import { Button } from "../ui/Button.tsx";
import type { Theme } from "./use-theme.ts";

interface TopBarProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  return (
    <Slot id="shell" tools={false} tag="below" sticky>
      <header className="flex items-center justify-between gap-4 border-b border-line-soft bg-page/82 px-[max(16px,calc((100vw-1180px)/2))] py-3 backdrop-blur-[10px] max-[560px]:gap-2">
        <a className="flex items-center gap-2.5 font-mono text-sm font-medium text-strong" href="#top">
          <BrandMark />
          <span className="max-[560px]:hidden">
            mfe<i className="mx-0.5 text-muted not-italic">/</i>anatomy
          </span>
        </a>
        <div className="flex items-center gap-2.5">
          <LiveCount />
          <InspectorSwitch />
          <Button onClick={onToggleTheme} aria-label="Toggle theme" className="max-[560px]:px-2.5 max-[560px]:py-1.5">
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </header>
    </Slot>
  );
}

/** Four modules in a chassis, in miniature. */
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
