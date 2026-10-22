import { test } from "node:test";
import assert from "node:assert/strict";
import { CAST_COUNT, parseDetails, summaryText } from "./tvmaze.ts";

const member = (person: string, character: string, photo: string | null = null) => ({
  person: { id: 1, name: person, image: photo === null ? null : { medium: photo } },
  character: { id: 2, name: character },
});

const tvmazeShow = (overrides: Record<string, unknown> = {}) => ({
  id: 169,
  url: "https://www.tvmaze.com/shows/169/breaking-bad",
  name: "Breaking Bad",
  status: "Ended",
  premiered: "2008-01-20",
  ended: "2019-10-11",
  network: { id: 20, name: "AMC" },
  webChannel: null,
  rating: { average: 9.2 },
  image: { medium: "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg" },
  summary: "<p><b>Breaking Bad</b> follows Walter White.</p>",
  _embedded: {
    cast: [
      member("Bryan Cranston", "Walter White", "https://static.tvmaze.com/bryan.jpg"),
      member("Aaron Paul", "Jesse Pinkman", "http://static.tvmaze.com/aaron.jpg"),
    ],
    seasons: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  },
  ...overrides,
});

test("parseDetails se queda con lo que usa la ficha", () => {
  assert.deepEqual(parseDetails(tvmazeShow()), {
    id: 169,
    name: "Breaking Bad",
    url: "https://www.tvmaze.com/shows/169/breaking-bad",
    status: "Ended",
    premiered: "2008-01-20",
    ended: "2019-10-11",
    network: "AMC",
    rating: 9.2,
    seasons: 5,
    summary: "Breaking Bad follows Walter White.",
    cast: [
      { person: "Bryan Cranston", character: "Walter White", image: "https://static.tvmaze.com/bryan.jpg" },
      // Solo fotos https: la de http se descarta.
      { person: "Aaron Paul", character: "Jesse Pinkman", image: null },
    ],
    image: "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
  });
});

test("parseDetails tolera datos que faltan y descarta lo que no es seguro", () => {
  const details = parseDetails(
    tvmazeShow({
      url: "https://evil.test/phish",
      network: null,
      webChannel: { id: 1, name: "Netflix" },
      rating: { average: null },
      premiered: null,
      summary: null,
      image: { medium: "http://static.tvmaze.com/x.jpg" },
      _embedded: undefined,
    }),
  );
  assert.equal(details.url, "https://www.tvmaze.com");
  assert.equal(details.network, "Netflix");
  assert.equal(details.rating, null);
  assert.equal(details.premiered, null);
  assert.equal(details.summary, "");
  assert.equal(details.image, undefined);
  assert.deepEqual([details.seasons, details.cast], [0, []]);
});

test("parseDetails muestra solo las primeras personas del elenco", () => {
  const cast = Array.from({ length: 9 }, (_, index) => member(`Persona ${index}`, `Papel ${index}`));
  assert.equal(parseDetails(tvmazeShow({ _embedded: { cast, seasons: [] } })).cast.length, CAST_COUNT);
});

test("parseDetails falla si la respuesta no es un programa", () => {
  assert.throws(() => parseDetails([]), /se esperaba un programa/);
});

test("summaryText quita las etiquetas y decodifica las entidades, sin dejar HTML vivo", () => {
  assert.equal(
    summaryText("<p>Tom &amp; Jerry&#39;s <i>show</i>&nbsp;&#x2014; again</p>"),
    "Tom & Jerry's show — again",
  );
  assert.equal(summaryText('<img src=x onerror="alert(1)">Hola<script>x()</script>'), "Hola x()");
  // Una entidad que se decodifica en "<" queda como texto: React la escapa al renderizar.
  assert.equal(summaryText("a &lt;b&gt; c"), "a <b> c");
  assert.equal(summaryText("&bogus; &#0;"), "&bogus; &#0;");
});
