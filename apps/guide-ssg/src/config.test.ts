import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePort } from "./config.ts";

test("parsePort usa el respaldo si la variable no está o está vacía", () => {
  assert.equal(parsePort(undefined, 5004), 5004);
  assert.equal(parsePort("", 5004), 5004);
});

test("parsePort acepta un puerto y rechaza lo que no lo es", () => {
  assert.equal(parsePort("5104", 5004), 5104);
  for (const value of ["abc", "-1", "70000"]) assert.throws(() => parsePort(value, 5004), /PORT inválido/);
});
