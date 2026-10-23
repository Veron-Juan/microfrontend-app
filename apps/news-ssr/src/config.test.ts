import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePort } from "./config.ts";

test("parsePort uses the fallback if the variable is missing or empty", () => {
  assert.equal(parsePort(undefined, 5003), 5003);
  assert.equal(parsePort("  ", 5003), 5003);
});

test("parsePort accepts a port number", () => {
  assert.equal(parsePort("5103", 5003), 5103);
});

test("parsePort rejects values that aren't a port", () => {
  for (const value of ["abc", "-1", "70000", "50.5"]) {
    assert.throws(() => parsePort(value, 5003), /invalid PORT/);
  }
});
