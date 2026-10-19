import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePort } from "./config.ts";

test("parsePort usa el respaldo si la variable no está o está vacía", () => {
  assert.equal(parsePort(undefined, 5003), 5003);
  assert.equal(parsePort("  ", 5003), 5003);
});

test("parsePort acepta un número de puerto", () => {
  assert.equal(parsePort("5103", 5003), 5103);
});

test("parsePort rechaza valores que no son un puerto", () => {
  for (const value of ["abc", "-1", "70000", "50.5"]) {
    assert.throws(() => parsePort(value, 5003), /PORT inválido/);
  }
});
