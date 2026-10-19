import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchLiveData, HEADLINE_COUNT, HEADLINES, liveDataAt, TEAMS } from "./live-data.ts";

const NOW = Date.UTC(2026, 9, 19, 19, 28, 15, 538);

test("liveDataAt es determinista para un mismo instante", () => {
  assert.deepEqual(liveDataAt(NOW), liveDataAt(NOW));
});

test("liveDataAt devuelve un marcador por partido con valores en rango", () => {
  const { scores } = liveDataAt(NOW);
  assert.equal(scores.length, TEAMS.length);
  for (const [index, score] of scores.entries()) {
    assert.deepEqual([score.home, score.away], TEAMS[index]);
    assert.ok(score.minute >= 1 && score.minute <= 90, `minuto fuera de rango: ${score.minute}`);
    assert.ok(score.goals[0] >= 0 && score.goals[0] <= 3);
    assert.ok(score.goals[1] >= 0 && score.goals[1] <= 2);
  }
});

test("liveDataAt elige titulares distintos y los rota cada 10 s", () => {
  const first = liveDataAt(NOW).headlines;
  assert.equal(first.length, HEADLINE_COUNT);
  assert.equal(new Set(first).size, HEADLINE_COUNT);
  for (const line of first) assert.ok(HEADLINES.includes(line));
  assert.notDeepEqual(liveDataAt(NOW + 10_000).headlines, first);
});

test("fetchLiveData espera con la demora inyectada y devuelve los datos de ese instante", async () => {
  let waits = 0;
  const data = await fetchLiveData(NOW, async () => {
    waits += 1;
  });
  assert.equal(waits, 1);
  assert.deepEqual(data, liveDataAt(NOW));
});
