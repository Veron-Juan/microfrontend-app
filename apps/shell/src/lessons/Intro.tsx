import { RenderSheets } from "./RenderSheets.tsx";

/** The first thing after the hero: what the page is made of, and the five apps one by one. */
export function Intro() {
  return (
    <section className="pt-14" aria-labelledby="intro-title">
      <h2
        id="intro-title"
        className="inline-block rounded-md border border-line-soft bg-card px-2.5 py-1.5 font-mono text-[11px]/none tracking-[.12em] text-muted uppercase shadow-lift"
      >
        Under the skin
      </h2>
      <p className="mt-5 mb-10 max-w-[640px] text-[17px]/[1.65] text-text [&_b]:font-medium">
        This page is made of <b>five independent applications</b>, each with its own code, its own server and its own
        version. A <em>shell</em> composes them live so they look like one. And since each one deploys on its own, each
        also chooses how to render: <b>News</b> is built on the server on every visit (SSR), the <b>Guide</b> was
        generated once at build time (SSG), and the <b>Catalog</b> and <b>Details</b> are built in your browser (CSR).
        That's why the lesson explains each of them along the way.
      </p>
      <RenderSheets />
    </section>
  );
}
