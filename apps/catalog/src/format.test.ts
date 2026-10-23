import { test } from "node:test";
import assert from "node:assert/strict";
import { artGradient, minutes } from "./format.ts";

test("minutes() converts seconds to rounded minutes", () => {
  assert.equal(minutes(5400), "90 min");
  assert.equal(minutes(89), "1 min");
  assert.equal(minutes(29), "0 min");
  assert.equal(minutes(0), "0 min");
});

test("artGradient() builds the gradient from the hue", () => {
  assert.equal(artGradient(210), "linear-gradient(140deg,hsl(210 45% 32%),hsl(240 40% 14%))");
});
