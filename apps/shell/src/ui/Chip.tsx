import type { RenderMode } from "@mfe/contracts";
import { cx } from "../lib/cx.ts";

/** A label in the render kind's color (CSR, SSR or SSG). */
export function Chip({ render, className }: { render: RenderMode; className?: string }) {
  return (
    <span
      data-render={render}
      className={cx(
        "inline-block rounded-[5px] bg-(--c)/14 px-1.5 py-1 font-mono text-[10.5px]/none font-medium tracking-[.06em] text-(--c) inset-ring inset-ring-(--c)/40",
        className,
      )}
    >
      {render}
    </span>
  );
}
