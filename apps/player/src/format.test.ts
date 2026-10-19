import { test } from "node:test";
import assert from "node:assert/strict";
import { advance, clock, progress, screenGradient } from "./format.ts";

test("clock() formatea m:ss con ceros a la izquierda", () => {
  assert.equal(clock(0), "0:00");
  assert.equal(clock(5), "0:05");
  assert.equal(clock(65.9), "1:05");
  assert.equal(clock(5400), "90:00");
});

test("clock() nunca muestra tiempos negativos", () => {
  assert.equal(clock(-3), "0:00");
});

test("progress() da el porcentaje y lo acota a 0–100", () => {
  assert.equal(progress(750, 3000), 25);
  assert.equal(progress(4000, 3000), 100);
  assert.equal(progress(-1, 3000), 0);
  assert.equal(progress(10, 0), 0);
});

test("advance() avanza 60× el tiempo real y se detiene al final", () => {
  assert.equal(advance(0, 1000, 3000), 60);
  assert.equal(advance(10, 500, 3000, 2), 11);
  assert.equal(advance(2990, 1000, 3000), 3000);
});

test("screenGradient() arma el fondo desde el tono", () => {
  assert.equal(screenGradient(150), "radial-gradient(120% 90% at 20% 10%,hsl(150 50% 30%),#050505 70%)");
});
