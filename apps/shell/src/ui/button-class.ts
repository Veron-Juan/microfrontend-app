import { cx } from "../lib/cx.ts";

const BASE =
  "inline-flex cursor-pointer items-center gap-2 no-underline transition-[border-color,transform] duration-200 ease-out-soft";

const VARIANTS = {
  /** Botón redondeado de la barra y la portada. */
  pill: "rounded-full border border-line bg-card px-[13px] py-[7px] text-[13px] font-medium text-strong hover:border-mid",
  /** La acción principal de una pantalla. */
  primary:
    "rounded-full border border-strong bg-strong px-[13px] py-[7px] text-[13px] font-medium text-page hover:-translate-y-px",
  /** Píldora chica en monoespaciada (la barra del navegador de la demo). */
  mini: "rounded-full border border-line bg-card px-2.5 py-1 font-mono text-[11px] text-strong hover:border-mid",
  /** Botón rectangular dentro de tarjetas. */
  outline: "rounded-lg border border-line bg-transparent px-3 py-[7px] text-[13px] text-strong hover:border-mid",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** Las clases de un botón, para usarlas también en un <a> que se ve como botón. */
export const buttonClass = (variant: ButtonVariant = "pill", className?: string) =>
  cx(BASE, VARIANTS[variant], className);
