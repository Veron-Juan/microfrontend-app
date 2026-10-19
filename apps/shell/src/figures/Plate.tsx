import type { RefObject } from "react";
import type { RenderMode } from "@mfe/contracts";
import { cx } from "../lib/cx.ts";

export interface LegendKey {
  render: RenderMode;
  label: string;
}

interface PlateProps {
  fig: string;
  title: string;
  hint: string;
  label: string;
  /** El SVG ya generado por @mfe/figures. */
  svg: string;
  keys: LegendKey[];
  caption: string;
  readoutRef: RefObject<HTMLSpanElement>;
  stageRef: RefObject<HTMLDivElement>;
  onClick?: () => void;
}

/** La lámina de una figura: esquinas con datos, el SVG y la leyenda. Las clases iso-* vienen del kit. */
export function Plate({ fig, title, hint, readoutRef, keys, caption, stageRef, svg, label, onClick }: PlateProps) {
  return (
    <figure className="iso-figure my-[30px]">
      <div className="iso-plate">
        <div className="iso-plate-corners" aria-hidden="true">
          <span className="iso-plate-corner" data-corner="fig">
            {fig}
          </span>
          <span className="iso-plate-corner" data-corner="title">
            {title}
          </span>
          <span className="iso-plate-corner" data-corner="hint">
            {hint}
          </span>
          <span className="iso-plate-corner" data-corner="readout" ref={readoutRef} />
        </div>
        <div
          ref={stageRef}
          tabIndex={0}
          role={onClick ? "button" : "img"}
          aria-label={label}
          onClick={onClick}
          onKeyDown={(event) => onClick && (event.key === "Enter" || event.key === " ") && onClick()}
          className={cx(
            "iso-stage outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-strong",
            onClick && "cursor-pointer",
          )}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <figcaption className="iso-legend">
        <span className="iso-keys">
          {keys.map((key) => (
            <span className="iso-key" key={key.label}>
              <i className="size-[9px] flex-none rounded-full bg-(--c)" data-render={key.render} />
              {key.label}
            </span>
          ))}
        </span>
        <span className="iso-caption max-w-[720px]">{caption}</span>
      </figcaption>
    </figure>
  );
}
