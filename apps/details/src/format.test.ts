import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRating, minutes, posterBackground, posterGradient, statusLabel, years } from "./format.ts";

test("posterGradient() arma el fondo desde el tono", () => {
  assert.equal(posterGradient(150), "linear-gradient(140deg,hsl(150 45% 32%),hsl(180 40% 14%))");
});

test("posterBackground() usa la carátula si es https y si no, el degradado", () => {
  const url = "https://static.tvmaze.com/uploads/images/medium_portrait/1/4600.jpg";
  assert.ok(posterBackground({ hue: 150, image: url }).startsWith(`url("${url}") center/cover,`));
  assert.equal(posterBackground({ hue: 150 }), posterGradient(150));
  assert.equal(posterBackground({ hue: 150, image: "javascript:alert(1)" }), posterGradient(150));
});

test("posterBackground() escapa las comillas para que la URL no pueda cerrar el url()", () => {
  const background = posterBackground({ hue: 0, image: 'https://x.test/a.jpg"),red;x:url("' });
  assert.ok(background.includes('url("https://x.test/a.jpg\\"),red;x:url(\\"")'));
});

test("statusLabel() traduce los estados conocidos y deja pasar los nuevos", () => {
  assert.equal(statusLabel("Ended"), "terminada");
  assert.equal(statusLabel("Running"), "en emisión");
  assert.equal(statusLabel("Paused"), "Paused");
});

test("years() muestra el rango, abierto si la serie sigue", () => {
  assert.equal(years("2008-01-20", "2013-09-29"), "2008–2013");
  assert.equal(years("2015-02-08", null), "2015–");
  assert.equal(years(null, null), "");
});

test("minutes() y formatRating() dan los textos de la ficha", () => {
  assert.equal(minutes(3600), "60 min");
  assert.equal(formatRating(9.2), "9,2");
  assert.equal(formatRating(8), "8,0");
});
