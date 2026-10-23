import assert from "node:assert/strict";
import { test } from "node:test";
import { createLimiter } from "./limits.ts";

test("the bucket lets the burst through and then asks to wait until a token is replenished", () => {
  let now = 0;
  const take = createLimiter({ burst: 3, perSecond: 1, perDay: 100, now: () => now });
  assert.deepEqual([take(), take(), take()], [0, 0, 0]);
  assert.equal(take(), 1);
  now += 1000;
  assert.equal(take(), 0);
  assert.equal(take(), 1);
});

test("the daily cap cuts off even with tokens left, and resets at midnight UTC", () => {
  let now = Date.UTC(2026, 9, 22, 23, 59, 0);
  const take = createLimiter({ burst: 10, perSecond: 10, perDay: 2, now: () => now });
  assert.deepEqual([take(), take()], [0, 0]);
  assert.equal(take(), 60);
  now = Date.UTC(2026, 9, 23, 0, 0, 1);
  assert.equal(take(), 0);
});
