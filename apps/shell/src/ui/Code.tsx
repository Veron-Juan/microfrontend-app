import type { ReactNode } from "react";
import { cx } from "../lib/cx.ts";
import { highlight } from "./highlight.ts";

export function Code({ children, className }: { children: string; className?: string }): ReactNode {
  return (
    <pre
      className={cx(
        "[scrollbar-width:thin] [scrollbar-color:var(--color-line)_transparent] overflow-x-auto font-mono text-[12.5px]/[1.7] text-text",
        className,
      )}
    >
      <code>
        {highlight(children).map((part, index) =>
          part.className ? (
            <span key={index} className={part.className}>
              {part.text}
            </span>
          ) : (
            part.text
          ),
        )}
      </code>
    </pre>
  );
}
