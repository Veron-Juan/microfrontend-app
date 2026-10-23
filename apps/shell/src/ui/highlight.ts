// Minimal highlighting for the lesson's snippets: comments, strings, keywords, function calls and
// numbers. It doesn't try to be a parser; it's enough for short, known code.
const TOKEN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(const|await|import|from|return|new|true|false)\b|(\b[A-Za-z_]\w*(?=\())|(\b\d+\b)/gm;
const CLASSES = ["text-muted italic", "text-ssg", "text-csr", "text-ssr", "text-strong"];

/** Splits the code into chunks with their color. Exported for testing. */
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
