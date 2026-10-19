import assert from "node:assert/strict";
import { test } from "node:test";
import { easeInOutCubic, laneTotal, renderModel } from "./render-model.ts";

test("SSR descuenta del total el tiempo que el servidor dice haber trabajado", () => {
  const model = renderModel({
    news: { status: "ready", ms: 120, headers: { "server-timing": "data;dur=70, render;dur=2" } },
  });
  assert.deepEqual(model.SSR, { server: 72, transfer: 48, browser: 0, ready: true });
});

test("CSR suma el tiempo de pintar en el navegador", () => {
  const model = renderModel({ catalog: { status: "ready", ms: 80, painted: 15 } });
  assert.equal(laneTotal(model.CSR), 95);
  assert.equal(model.SSG.ready, false);
});

test("la curva empieza en 0, termina en 1 y pasa por la mitad", () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);
});
