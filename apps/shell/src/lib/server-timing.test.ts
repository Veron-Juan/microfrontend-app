import assert from "node:assert/strict";
import { test } from "node:test";
import { serverTimingTotal } from "./server-timing.ts";

test("sums every Server-Timing metric", () => {
  assert.equal(serverTimingTotal("data;dur=42, render;dur=1.5"), 43.5);
});

test("ignores metrics without a duration and empty headers", () => {
  assert.equal(serverTimingTotal("cache;desc=hit, db;dur=7"), 7);
  assert.equal(serverTimingTotal(""), 0);
  assert.equal(serverTimingTotal(undefined), 0);
});
