import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRating, minutes, posterBackground, posterGradient, statusLabel, years } from "./format.ts";

test("posterGradient() builds the background from the hue", () => {
  assert.equal(posterGradient(150), "linear-gradient(140deg,hsl(150 45% 32%),hsl(180 40% 14%))");
});

test("posterBackground() uses the poster if it's https, otherwise the gradient", () => {
  const url = "https://static.tvmaze.com/uploads/images/medium_portrait/1/4600.jpg";
  assert.ok(posterBackground({ hue: 150, image: url }).startsWith(`url("${url}") center/cover,`));
  assert.equal(posterBackground({ hue: 150 }), posterGradient(150));
  assert.equal(posterBackground({ hue: 150, image: "javascript:alert(1)" }), posterGradient(150));
});

test("posterBackground() escapes quotes so the URL can't close the url()", () => {
  const background = posterBackground({ hue: 0, image: 'https://x.test/a.jpg"),red;x:url("' });
  assert.ok(background.includes('url("https://x.test/a.jpg\\"),red;x:url(\\"")'));
});

test("statusLabel() relabels known statuses and passes new ones through", () => {
  assert.equal(statusLabel("Ended"), "ended");
  assert.equal(statusLabel("Running"), "airing");
  assert.equal(statusLabel("Paused"), "Paused");
});

test("years() shows the range, open if the show continues", () => {
  assert.equal(years("2008-01-20", "2013-09-29"), "2008–2013");
  assert.equal(years("2015-02-08", null), "2015–");
  assert.equal(years(null, null), "");
});

test("minutes() and formatRating() produce the card's texts", () => {
  assert.equal(minutes(3600), "60 min");
  assert.equal(formatRating(9.2), "9.2");
  assert.equal(formatRating(8), "8.0");
});
