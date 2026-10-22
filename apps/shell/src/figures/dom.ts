/** Busca una pieza de la figura por su data-part. Si falta, el SVG generado y este código se desalinearon. */
export function part(root: Element, name: string): SVGElement {
  const found = root.querySelector<SVGElement>(`[data-part="${name}"]`);
  if (!found) throw new Error(`La figura no tiene la pieza "${name}"`);
  return found;
}

/** Cambia el texto solo si es distinto, para no tocar el DOM en cada frame. */
export function say(element: Element, text: string) {
  if (element.textContent !== text) element.textContent = text;
}

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
