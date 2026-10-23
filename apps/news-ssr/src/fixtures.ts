// Fixed data shaped like LiveData, to test the render and the server without calling the APIs.
import type { LiveData } from "./live-data.ts";

export const SAMPLE_DATA: LiveData = {
  matches: {
    ok: true,
    age: 12,
    items: [
      {
        id: "1",
        league: "Argentinian Primera Division",
        home: "Deportivo Riestra",
        away: "Unión",
        kickoff: "2026-10-20T00:15:00.000Z",
        status: "FT",
        goals: [1, 1],
        badges: ["https://r2.thesportsdb.com/images/media/team/badge/riestra.png/tiny", null],
      },
      {
        id: "2",
        league: "Brazilian Serie B",
        home: "Londrina",
        away: "Cuiabá",
        kickoff: "2026-10-20T22:30:00.000Z",
        status: "2H",
        goals: [1, 0],
        badges: [null, null],
      },
      {
        id: "3",
        league: "American USL Championship",
        home: "Brooklyn FC",
        away: "Birmingham Legion",
        kickoff: "2026-10-21T22:30:00.000Z",
        status: "NS",
        goals: null,
        badges: [null, null],
      },
    ],
  },
  premieres: {
    ok: true,
    age: 0,
    items: [
      {
        id: 10,
        show: "The Terminal List",
        episode: "S2 · premiere",
        platform: "Prime Video",
        image: "https://static.tvmaze.com/10.jpg",
      },
      { id: 11, show: "Where's Wanda?", episode: "S2 · premiere", platform: "Apple TV", image: null },
      { id: 12, show: "Ellie & Natasia", episode: "S2 E3", platform: "BBC iPlayer", image: null },
    ],
  },
};
