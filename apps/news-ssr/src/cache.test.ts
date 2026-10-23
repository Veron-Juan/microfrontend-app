import assert from "node:assert/strict";
import { test } from "node:test";
import { cached } from "./cache.ts";

// A clock the tests move forward and an "API" that counts its calls.
function setup(results: (() => Promise<string>)[]) {
  let time = 1000;
  let calls = 0;
  const source = cached(
    () => results[Math.min(calls++, results.length - 1)](),
    60_000,
    () => time,
  );
  return { source, calls: () => calls, advance: (ms: number) => (time += ms) };
}

test("cached reuses the response until it expires and fetches it again afterwards", async () => {
  let n = 0;
  const { source, calls, advance } = setup([async () => `response ${++n}`]);
  assert.deepEqual(await source(), { value: "response 1", at: 1000 });
  advance(59_999);
  assert.equal((await source()).value, "response 1");
  assert.equal(calls(), 1);
  advance(1);
  assert.deepEqual(await source(), { value: "response 2", at: 61_000 });
  assert.equal(calls(), 2);
});

test("cached makes a single call for simultaneous requests", async () => {
  const { source, calls } = setup([async () => "ok"]);
  const all = await Promise.all([source(), source(), source()]);
  assert.equal(calls(), 1);
  assert.deepEqual(
    all.map((entry) => entry.value),
    ["ok", "ok", "ok"],
  );
});

test("if the API fails, cached returns the last good response even if expired", async () => {
  const { source, advance } = setup([async () => "old", () => Promise.reject(new Error("down"))]);
  await source();
  advance(120_000);
  assert.deepEqual(await source(), { value: "old", at: 1000 });
});

test("if the API fails and never responded, cached propagates the error and retries on the next call", async () => {
  const { source, calls } = setup([() => Promise.reject(new Error("down")), async () => "back"]);
  await assert.rejects(source(), /down/);
  assert.equal((await source()).value, "back");
  assert.equal(calls(), 2);
});
