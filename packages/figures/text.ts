// Texto apoyado sobre la cara superior de una pieza: se inclina con ella y queda alineado con su eje x.
// El tamaño va en unidades del mundo, así que crece y se encoge con la figura.
import * as k from "./kit/iso-kit.ts";

export interface Line {
  text: string;
  className: string;
  size: number;
  part?: string;
  /** Atributos extra para el <text>, ya escritos (data-render="SSG"). */
  attrs?: string;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

/** Un bloque de líneas centrado en un punto de la cara superior a la altura z. */
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
