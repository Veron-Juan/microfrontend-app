import type { ReactNode } from "react";
import { cx } from "../lib/cx.ts";

// Los estilos de celdas viven aquí, una vez, en lugar de repetirse en cada <td>.
const TABLE = cx(
  "w-full border-collapse text-[13.5px]",
  "[&_td]:border-b [&_td]:border-line-soft [&_td]:px-3.5 [&_td]:py-2.5 [&_td]:text-left [&_td]:align-top",
  "[&_th]:border-b [&_th]:border-line-soft [&_th]:px-3.5 [&_th]:py-2.5 [&_th]:text-left [&_th]:align-top",
  "[&_tr:last-child>*]:border-b-0",
  "[&_thead_th]:font-medium [&_thead_th]:whitespace-nowrap",
  "[&_tbody_th]:font-[550] [&_tbody_th]:whitespace-nowrap [&_tbody_th]:text-strong",
);

const HEADINGS = {
  /** Encabezados chicos en mayúsculas, para tablas de datos. */
  label:
    "[&_thead_th]:font-mono [&_thead_th]:text-[11px] [&_thead_th]:tracking-[.06em] [&_thead_th]:text-muted [&_thead_th]:uppercase",
  /** Encabezados en texto normal, para tablas comparativas. */
  plain: "[&_thead_th]:text-xs [&_thead_th]:text-strong",
} as const;

interface TableProps {
  children: ReactNode;
  headings?: keyof typeof HEADINGS;
  className?: string;
}

export function Table({ children, headings = "label", className }: TableProps) {
  return (
    <div className="my-[22px] overflow-x-auto rounded-xl border border-line-soft bg-card">
      <table className={cx(TABLE, HEADINGS[headings], className)}>{children}</table>
    </div>
  );
}
