import type { ReactNode } from "react";
import { cx } from "../lib/cx.ts";

import { cardClass } from "./card-class.ts";

interface CardProps {
  title: ReactNode;
  children: ReactNode;
  /** Algo que va junto al título, como un <Tag>. */
  aside?: ReactNode;
  className?: string;
}

export function Card({ title, aside, children, className }: CardProps) {
  return (
    <div className={cx(cardClass, className)}>
      <h3 className="mb-1.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-strong">
        {title} {aside}
      </h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}

const COLUMNS = {
  two: "grid-cols-[repeat(auto-fit,minmax(260px,1fr))]",
  three: "grid-cols-[repeat(auto-fit,minmax(220px,1fr))]",
  four: "grid-cols-[repeat(auto-fit,minmax(190px,1fr))]",
} as const;

/** Una grilla de tarjetas que se reacomoda sola según el ancho. */
export function Cards({ columns, children }: { columns: keyof typeof COLUMNS; children: ReactNode }) {
  return <div className={cx("my-[22px] grid gap-3", COLUMNS[columns])}>{children}</div>;
}

export function Tag({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cx(
        "rounded-full border px-[7px] py-0.5 font-mono text-[10.5px] font-normal tracking-[.06em] uppercase",
        active ? "border-strong text-strong" : "border-line text-muted",
      )}
    >
      {children}
    </span>
  );
}
