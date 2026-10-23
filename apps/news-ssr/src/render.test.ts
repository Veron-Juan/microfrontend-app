import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_DATA } from "./fixtures.ts";
import type { LiveData } from "./live-data.ts";
import { formatKickoff, formatRenderedAt, renderFragment, standalonePage } from "./render.tsx";

const NOW = Date.UTC(2026, 9, 19, 19, 28, 15, 538);

const render = (data: LiveData = SAMPLE_DATA) =>
  renderFragment({
    css: ".x{color:red}",
    served: 7,
    fetchData: async () => data,
    now: () => NOW,
    newRequestId: () => "abcd1234",
  });

test("formatRenderedAt includes the milliseconds", () => {
  assert.match(formatRenderedAt(NOW), /^\d{1,2}:\d{2}:\d{2}\.538$/);
});

test("renderFragment returns a self-contained fragment: <style> and then the section", async () => {
  const { html, now, requestId } = await render();
  assert.equal(now, NOW);
  assert.equal(requestId, "abcd1234");
  assert.ok(html.startsWith("<style>.x{color:red}</style><section"), html.slice(0, 60));
  assert.doesNotMatch(html, /<html|<body/);
});

test("formatKickoff shows hours and minutes", () => {
  assert.match(formatKickoff("2026-10-21T22:30:00.000Z"), /^\d{2}:\d{2}$/);
});

test("the fragment has News's structure: matches, news, credits and footer", async () => {
  const { html } = await render();
  assert.match(html, /data-request="abcd1234"/);
  assert.match(html, /<h3[^>]*>Live news<\/h3>/);
  assert.equal(html.match(/<ul[^>]*>.*<\/ul>/)?.[0].match(/<li /g)?.length, SAMPLE_DATA.matches.items.length);
  assert.equal(html.match(/<ol[^>]*>.*<\/ol>/)?.[0].match(/<li /g)?.length, SAMPLE_DATA.premieres.items.length);
  // The names come from an external API: React escapes them before the shell does innerHTML.
  assert.ok(html.includes("The Terminal List"));
  assert.ok(html.includes("Where&#x27;s Wanda?"));
  assert.ok(html.includes("Ellie &amp; Natasia"));
  assert.ok(html.includes(">full time<") && html.includes(">live<"));
  // The live match carries the blinking dot; badges and posters are <img> with their URL.
  assert.match(html, /nws:animate-live/);
  assert.ok(html.includes('<img src="https://r2.thesportsdb.com/images/media/team/badge/riestra.png/tiny"'));
  assert.ok(html.includes('<img src="https://static.tvmaze.com/10.jpg"'));
  assert.match(html, /<a href="https:\/\/www\.thesportsdb\.com"[^>]*>TheSportsDB<\/a>/);
  assert.match(html, /<a href="https:\/\/www\.tvmaze\.com"[^>]*>TVmaze<\/a>/);
  assert.match(html, /12 s old/);
  assert.match(html, /request #<!-- -->7<!-- --> on this server/);
  // Every class carries the remote's prefix.
  const classes = [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" "));
  assert.ok(classes.length > 0);
  for (const name of classes) assert.ok(name.startsWith("nws:"), `class without prefix: ${name}`);
});

test("if a source failed, its section shows a notice and the other looks the same", async () => {
  const { html } = await render({ ...SAMPLE_DATA, matches: { items: [], ok: false, age: 0 } });
  assert.doesNotMatch(html, /<ul/);
  assert.match(html, /The source didn&#x27;t respond/);
  assert.match(html, /<ol/);
  assert.match(html, /no response/);
});

test("standalonePage wraps the fragment in a page with the light theme", () => {
  const page = standalonePage("<section>hello</section>", "body{}");
  assert.match(page, /^<!doctype html><html lang="en" data-theme="light">/);
  assert.ok(page.includes("<style>body{}</style>"));
  assert.ok(page.includes("<section>hello</section></body></html>"));
});
