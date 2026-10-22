import assert from "node:assert/strict";
import { test } from "node:test";
import { cached } from "./cache.ts";

// Un reloj que avanzan los tests y una "API" que cuenta sus llamadas.
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

test("cached reutiliza la respuesta mientras no vence y la vuelve a pedir después", async () => {
  let n = 0;
  const { source, calls, advance } = setup([async () => `respuesta ${++n}`]);
  assert.deepEqual(await source(), { value: "respuesta 1", at: 1000 });
  advance(59_999);
  assert.equal((await source()).value, "respuesta 1");
  assert.equal(calls(), 1);
  advance(1);
  assert.deepEqual(await source(), { value: "respuesta 2", at: 61_000 });
  assert.equal(calls(), 2);
});

test("cached hace una sola llamada para requests simultáneas", async () => {
  const { source, calls } = setup([async () => "ok"]);
  const all = await Promise.all([source(), source(), source()]);
  assert.equal(calls(), 1);
  assert.deepEqual(
    all.map((entry) => entry.value),
    ["ok", "ok", "ok"],
  );
});

test("si la API falla, cached devuelve la última respuesta buena aunque esté vencida", async () => {
  const { source, advance } = setup([async () => "vieja", () => Promise.reject(new Error("caída"))]);
  await source();
  advance(120_000);
  assert.deepEqual(await source(), { value: "vieja", at: 1000 });
});

test("si la API falla y nunca respondió, cached propaga el error y reintenta en la siguiente", async () => {
  const { source, calls } = setup([() => Promise.reject(new Error("caída")), async () => "volvió"]);
  await assert.rejects(source(), /caída/);
  assert.equal((await source()).value, "volvió");
  assert.equal(calls(), 2);
});
