import assert from "node:assert/strict";
import { test } from "node:test";
import { CHANNELS, formatBuiltAt, HOURS, scheduleProblems, type Channel } from "./schedule.ts";

test("la grilla publicada no tiene problemas", () => {
  assert.deepEqual(scheduleProblems(CHANNELS, HOURS), []);
});

test("scheduleProblems detecta filas incompletas, duraciones inválidas y canales repetidos", () => {
  const channels: Channel[] = [
    { number: 1, name: "Corto", slots: [{ title: "A", span: 1 }] },
    {
      number: 1,
      name: "Raro",
      slots: [
        { title: "B", span: 0 },
        { title: "C", span: 2 },
      ],
    },
  ];
  assert.deepEqual(scheduleProblems(channels, ["18:00", "19:00"]), [
    "Corto: ocupa 1 h de 2",
    "canal 1 repetido",
    "Raro: hay un programa con duración inválida",
  ]);
});

test("formatBuiltAt muestra día, mes y hora", () => {
  assert.match(formatBuiltAt(new Date(2026, 9, 19, 18, 12, 34)), /^19 oct\.? a las 18:12:34$/);
});
