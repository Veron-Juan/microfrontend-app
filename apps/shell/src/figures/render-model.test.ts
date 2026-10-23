import assert from "node:assert/strict";
import { test } from "node:test";
import { easeInOutCubic, laneTotal, renderModel } from "./render-model.ts";

test("SSR subtracts from the total the time the server says it worked", () => {
  const model = renderModel({
    news: { status: "ready", ms: 120, headers: { "server-timing": "data;dur=70, render;dur=2" } },
  });
  assert.deepEqual(model.SSR, { server: 72, transfer: 48, browser: 0, ready: true });
});

test("CSR adds the time spent painting in the browser", () => {
  const model = renderModel({ catalog: { status: "ready", ms: 80, painted: 15 } });
  assert.equal(laneTotal(model.CSR), 95);
  assert.equal(model.SSG.ready, false);
});

test("the curve starts at 0, ends at 1 and passes through the middle", () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);
});
