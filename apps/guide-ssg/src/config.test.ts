import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePort, parseShowId } from "./config.ts";

test("parsePort uses the fallback if the variable is missing or empty", () => {
  assert.equal(parsePort(undefined, 5004), 5004);
  assert.equal(parsePort("", 5004), 5004);
});

test("parsePort accepts a port and rejects what isn't one", () => {
  assert.equal(parsePort("5104", 5004), 5104);
  for (const value of ["abc", "-1", "70000"]) assert.throws(() => parsePort(value, 5004), /invalid PORT/);
});

test("parseShowId accepts a show id and rejects what isn't one", () => {
  assert.equal(parseShowId(undefined, 169), 169);
  assert.equal(parseShowId("82", 169), 82);
  for (const value of ["abc", "0", "1.5"]) assert.throws(() => parseShowId(value, 169), /invalid GUIDE_SHOW_ID/);
});
