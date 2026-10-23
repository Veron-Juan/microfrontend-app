import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { initialState, markLoad, reload, setBroken, store, toggleInspector } from "./store.ts";

beforeEach(() => store.set(initialState));

test("markLoad merges each update into the previous load", () => {
  markLoad("news", { status: "loading", start: 10 });
  markLoad("news", { status: "ready", ms: 42 });
  assert.deepEqual(store.get().loads.news, { status: "ready", start: 10, ms: 42 });
});

test("reload bumps the nonce so the remote is requested again", () => {
  reload("catalog");
  reload("catalog");
  assert.equal(store.get().nonce.catalog, 2);
});

test("setBroken flags the remote and forces a reload", () => {
  setBroken("details", true);
  assert.equal(store.get().broken.details, true);
  assert.equal(store.get().nonce.details, 1);
});

test("subscribers hear about every change", () => {
  let calls = 0;
  const stop = store.subscribe(() => (calls += 1));
  toggleInspector();
  stop();
  toggleInspector();
  assert.equal(calls, 1);
});
