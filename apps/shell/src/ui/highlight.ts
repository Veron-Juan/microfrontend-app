// Un resaltado mínimo para los fragmentos de la lección: comentarios, textos, palabras clave,
// llamadas a funciones y números. No pretende ser un parser; alcanza para código corto y conocido.
const TOKEN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(const|await|import|from|return|new|true|false)\b|(\b[A-Za-z_]\w*(?=\())|(\b\d+\b)/gm;
const CLASSES = ["text-muted italic", "text-ssg", "text-csr", "text-ssr", "text-strong"];

/** Separa el código en trozos con su color. Exportado para probarlo. */
export function highlight(code: string): { text: string; className?: string }[] {
  const parts: { text: string; className?: string }[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    if (match.index > last) parts.push({ text: code.slice(last, match.index) });
    const group = match.slice(1).findIndex((value) => value !== undefined);
    parts.push({ text: match[0], className: CLASSES[group] });
    last = match.index + match[0].length;
  }
  if (last < code.length) parts.push({ text: code.slice(last) });
  return parts;
}
