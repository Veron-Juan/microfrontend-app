import assert from "node:assert/strict";
import { test } from "node:test";
import { cx } from "./cx.ts";

test("cx descarta los valores falsos", () => {
  assert.equal(cx("a", false, "b", undefined, null, ""), "a b");
});
