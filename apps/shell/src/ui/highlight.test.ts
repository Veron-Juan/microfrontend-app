import assert from "node:assert/strict";
import { test } from "node:test";
import { highlight } from "./highlight.ts";

test("highlight colors strings, keywords, calls and comments, and keeps all the code", () => {
  const code = 'const html = await fetch("/fragment/news"); // fetch the HTML';
  const parts = highlight(code);
  assert.equal(parts.map((part) => part.text).join(""), code);
  const colored = Object.fromEntries(parts.filter((part) => part.className).map((part) => [part.text, part.className]));
  assert.deepEqual(colored, {
    const: "text-csr",
    await: "text-csr",
    fetch: "text-ssr",
    '"/fragment/news"': "text-ssg",
    "// fetch the HTML": "text-muted italic",
  });
});

test("highlight doesn't mistake a keyword inside a string", () => {
  const parts = highlight('"const await"');
  assert.deepEqual(parts, [{ text: '"const await"', className: "text-ssg" }]);
});
