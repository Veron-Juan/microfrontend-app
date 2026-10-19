import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { initialState, markLoad, reload, setBroken, store, toggleInspector } from "./store.ts";

beforeEach(() => store.set(initialState));

test("markLoad fusiona cada actualización con la carga anterior", () => {
  markLoad("news", { status: "loading", start: 10 });
  markLoad("news", { status: "ready", ms: 42 });
  assert.deepEqual(store.get().loads.news, { status: "ready", start: 10, ms: 42 });
});

test("reload incrementa el nonce para que el remote se vuelva a pedir", () => {
  reload("catalog");
  reload("catalog");
  assert.equal(store.get().nonce.catalog, 2);
});

test("setBroken marca el remote y fuerza una recarga", () => {
  setBroken("player", true);
  assert.equal(store.get().broken.player, true);
  assert.equal(store.get().nonce.player, 1);
});

test("los suscriptores se enteran de cada cambio", () => {
  let calls = 0;
  const stop = store.subscribe(() => (calls += 1));
  toggleInspector();
  stop();
  toggleInspector();
  assert.equal(calls, 1);
});
