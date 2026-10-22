import assert from "node:assert/strict";
import { test } from "node:test";
import { highlight } from "./highlight.ts";

test("highlight colorea textos, palabras clave, llamadas y comentarios, y conserva todo el código", () => {
  const code = 'const html = await fetch("/fragment/news"); // pide el HTML';
  const parts = highlight(code);
  assert.equal(parts.map((part) => part.text).join(""), code);
  const colored = Object.fromEntries(parts.filter((part) => part.className).map((part) => [part.text, part.className]));
  assert.deepEqual(colored, {
    const: "text-csr",
    await: "text-csr",
    fetch: "text-ssr",
    '"/fragment/news"': "text-ssg",
    "// pide el HTML": "text-muted italic",
  });
});

test("highlight no confunde una palabra clave dentro de un texto", () => {
  const parts = highlight('"const await"');
  assert.deepEqual(parts, [{ text: '"const await"', className: "text-ssg" }]);
});
