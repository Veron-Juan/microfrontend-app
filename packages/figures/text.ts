// Text lying on a piece's top face: it tilts with it and stays aligned with its x axis.
// The size is in world units, so it grows and shrinks with the figure.
import * as k from "./kit/iso-kit.ts";

export interface Line {
  text: string;
  className: string;
  size: number;
  part?: string;
  /** Extra attributes for the <text>, already written out (data-render="SSG"). */
  attrs?: string;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

/** A block of lines centered on a point of the top face at height z. */
export function faceLabel(
  [x, y]: k.Plane,
  z: number,
  projection: k.Projection,
  lines: Line[],
  { gap = 2, anchor = "middle" }: { gap?: number; anchor?: "start" | "middle" | "end" } = {},
) {
  const height = lines.reduce((sum, line) => sum + line.size, 0) + gap * (lines.length - 1);
  let top = -height / 2;
  const rows = lines.map((line) => {
    const extra = (line.part ? ` data-part="${line.part}"` : "") + (line.attrs ? ` ${line.attrs}` : "");
    const row = `<text class="${line.className}"${extra} y="${tenth(top + line.size / 2)}" font-size="${line.size}" text-anchor="${anchor}" dominant-baseline="central">${line.text}</text>`;
    top += line.size + gap;
    return row;
  });
  return `<g class="fig-face" transform="${k.topMatrix([x, y], z, projection, "x")}">${rows.join("")}</g>`;
}
