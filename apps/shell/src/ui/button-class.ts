import { cx } from "../lib/cx.ts";

const BASE =
  "inline-flex cursor-pointer items-center gap-2 no-underline transition-[border-color,transform] duration-200 ease-out-soft";

const VARIANTS = {
  /** Rounded button for the top bar and the hero. */
  pill: "rounded-full border border-line bg-card px-[13px] py-[7px] text-[13px] font-medium text-strong hover:border-mid",
  /** A screen's main action. */
  primary:
    "rounded-full border border-strong bg-strong px-[13px] py-[7px] text-[13px] font-medium text-page hover:-translate-y-px",
  /** Small monospace pill (the demo's browser bar). */
  mini: "rounded-full border border-line bg-card px-2.5 py-1 font-mono text-[11px] text-strong hover:border-mid",
  /** Rectangular button inside cards. */
  outline: "rounded-lg border border-line bg-transparent px-3 py-[7px] text-[13px] text-strong hover:border-mid",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** A button's classes, to also use on an <a> that looks like a button. */
export const buttonClass = (variant: ButtonVariant = "pill", className?: string) =>
  cx(BASE, VARIANTS[variant], className);
