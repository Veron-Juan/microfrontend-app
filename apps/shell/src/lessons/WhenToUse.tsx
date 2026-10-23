import { Cards } from "../ui/Card.tsx";
import { cardClass } from "../ui/card-class.ts";
import { Lesson, Rules } from "../ui/Lesson.tsx";

/** The lesson's terms, grouped by what they name. */
const GLOSSARY = [
  { term: "Shell / host", group: "pieces", definition: "The app that contains and orchestrates the others." },
  { term: "Remote", group: "pieces", definition: "An app that exposes pieces for another one to consume." },
  {
    term: "mf-manifest.json",
    group: "wiring",
    definition: "What a Module Federation remote publishes: what it exposes, what it shares and where its files are.",
  },
  {
    term: "Discovery",
    group: "wiring",
    definition:
      "The service (or file) that says where each micro-frontend lives in each environment. Here, remotes.json.",
  },
  { term: "Fragment", group: "wiring", definition: "A piece of HTML with no <html> or <body>, ready to embed." },
  {
    term: "ESI / SSI",
    group: "wiring",
    definition: "Tags that a CDN or a server replaces with fragments before responding.",
  },
  {
    term: "Hydration",
    group: "rendering",
    definition: "Attaching JavaScript to HTML that arrived already rendered, to make it interactive.",
  },
  {
    term: "Islands",
    group: "rendering",
    definition: "Interactive parts that hydrate separately inside a page of static HTML.",
  },
  {
    term: "Singleton",
    group: "dependencies",
    definition: "A shared dependency of which the whole page uses a single instance, like React.",
  },
  {
    term: "Design tokens",
    group: "styling",
    definition: "Shared design values (colors, typefaces). Each app compiles its own styles from them.",
  },
] as const;

export function WhenToUse() {
  return (
    <Lesson id="when" title="When is it worth it?" kicker="It's an organizational solution before a technical one.">
      <Cards columns="two">
        <div className={cardClass}>
          <h3 className="mb-1.5 text-sm font-semibold text-strong">It's worth it when…</h3>
          <Rules>
            <li>Several teams work on the same product and keep blocking each other.</li>
            <li>Parts of the site change at very different paces (the guide vs. the catalog).</li>
            <li>You need to migrate an old app bit by bit without rewriting it all at once.</li>
            <li>
              Each part needs its own rendering and also its own deploy (if it's only the rendering, a framework solves
              that per route).
            </li>
          </Rules>
        </div>
        <div className={cardClass}>
          <h3 className="mb-1.5 text-sm font-semibold text-strong">It costs…</h3>
          <Rules>
            <li>More infrastructure: several pipelines, servers and versions to watch.</li>
            <li>Visual consistency: you need a shared design system (here, @mfe/design-tokens).</li>
            <li>Performance: duplicated dependencies if they aren't shared well.</li>
            <li>Discipline: event and route contracts that can't be broken without versioning them.</li>
          </Rules>
        </div>
      </Cards>
      <Glossary />
    </Lesson>
  );
}

function Glossary() {
  return (
    <div className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-[26px] font-medium tracking-[-.01em] text-strong">Glossary</h3>
        <span className="font-mono text-[11px] tracking-[.1em] text-muted uppercase">
          {GLOSSARY.length} terms from this lesson
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
        {GLOSSARY.map(({ term, group, definition }) => (
          <div
            key={term}
            className="group grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-xl border border-line-soft bg-card p-4 shadow-lift transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-line"
          >
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-lg bg-line-soft font-serif text-[22px] font-medium text-strong transition-colors group-hover:bg-strong group-hover:text-card"
            >
              {term.charAt(0).toUpperCase()}
            </span>
            <div className="grid content-start gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="font-mono text-[13.5px] font-semibold text-strong">{term}</dt>
                <span className="rounded-full border border-line px-2 py-px font-mono text-[10px] tracking-[.06em] text-muted uppercase">
                  {group}
                </span>
              </div>
              <dd className="text-[13.5px]/[1.55] text-text">{definition}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
