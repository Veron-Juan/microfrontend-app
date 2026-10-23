import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_DATA } from "./fixtures.ts";
import { createLiveData, type Sources } from "./live-data.ts";

const NOW = Date.UTC(2026, 9, 21, 19, 0, 0);

const sources = (overrides: Partial<Sources> = {}): Sources => ({
  matches: async () => ({ value: SAMPLE_DATA.matches.items, at: NOW - 12_000 }),
  premieres: async () => ({ value: SAMPLE_DATA.premieres.items, at: NOW }),
  ...overrides,
});

test("createLiveData combines both sources and computes the age of each", async () => {
  const data = await createLiveData(sources())(NOW);
  assert.deepEqual(data, SAMPLE_DATA);
});

test("if one source fails, the other still arrives and the failure is reported", async () => {
  const errors: unknown[] = [];
  const data = await createLiveData(
    sources({ premieres: () => Promise.reject(new Error("TVmaze: HTTP 503")) }),
    (error) => errors.push(error),
  )(NOW);
  assert.deepEqual(data.matches, SAMPLE_DATA.matches);
  assert.deepEqual(data.premieres, { items: [], ok: false, age: 0 });
  assert.equal(errors.length, 1);
});
