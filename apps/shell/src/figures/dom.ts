/** Finds a piece of the figure by its data-part. If it's missing, the generated SVG and this code drifted apart. */
export function part(root: Element, name: string): SVGElement {
  const found = root.querySelector<SVGElement>(`[data-part="${name}"]`);
  if (!found) throw new Error(`The figure has no piece "${name}"`);
  return found;
}

/** Changes the text only if it's different, so the DOM isn't touched on every frame. */
export function say(element: Element, text: string) {
  if (element.textContent !== text) element.textContent = text;
}

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
