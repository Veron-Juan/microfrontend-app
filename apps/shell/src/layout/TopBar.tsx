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

/*
 * Fig. 1 in miniature: the page taken apart into isometric sheets, one per kind of rendering, with
 * the dotted guides of an exploded view. The sheets are opaque (tinted with the page), so each one
 * hides the back edges of the one under it.
 */
function BrandMark() {
  const sheet =
    "fill-[color-mix(in_srgb,var(--c)_20%,var(--mfe-page))] stroke-(--c) stroke-[1.1] [stroke-linejoin:round]";
  return (
    <svg className="size-[22px]" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6.5v11M21 6.5v11" className="fill-none stroke-mid stroke-[0.8] [stroke-dasharray:1.2_1.4]" />
      <path d="M12 13l9 4.5-9 4.5-9-4.5z" data-render="SSG" className={sheet} />
      <path d="M12 7.5l9 4.5-9 4.5-9-4.5z" data-render="CSR" className={sheet} />
      <path d="M12 2l9 4.5-9 4.5-9-4.5z" data-render="SSR" className={sheet} />
    </svg>
  );
}
