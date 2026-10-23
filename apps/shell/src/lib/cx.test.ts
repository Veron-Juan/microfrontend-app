import assert from "node:assert/strict";
import { test } from "node:test";
import { cx } from "./cx.ts";

test("cx drops falsy values", () => {
  assert.equal(cx("a", false, "b", undefined, null, ""), "a b");
});
