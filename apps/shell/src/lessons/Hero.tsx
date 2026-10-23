import { environment } from "../mfe/registry.ts";
import { toggleInspector, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { buttonClass } from "../ui/button-class.ts";
import { RenderSheets } from "./RenderSheets.tsx";

const DOT_GRID =
  "before:pointer-events-none before:absolute before:inset-y-0 before:-inset-x-10 before:z-0 before:bg-[radial-gradient(var(--mfe-mid)_1px,transparent_1px)] before:bg-size-[18px_18px] before:opacity-20 before:[mask-image:linear-gradient(180deg,#000_10%,transparent_90%)] before:content-['']";

export function Hero() {
  const inspector = useStore((s) => s.inspector);
  return (
    <section className={`relative pt-[72px] pb-10 *:relative ${DOT_GRID}`}>
      {environment() === "preview" && <PreviewNote />}
      <p className="mb-3.5 font-mono text-xs tracking-[.12em] text-muted uppercase">A lesson that is its own example</p>
      <h1 className="mb-[22px] font-serif text-[clamp(40px,7vw,78px)]/[.98] font-medium tracking-[-.02em] text-strong">
        Anatomy of a micro-frontend
      </h1>
      <p className="mb-4 max-w-[640px] font-serif text-[clamp(19px,2.2vw,23px)]/[1.45] text-text [&_b]:font-medium">
        A project with two goals: to show how a <b>micro-frontend</b> works from the inside, and to prove that{" "}
        <b>different kinds of rendering</b> can live together on one page.
      </p>
      <p className="mb-7 max-w-[640px] text-[16px]/[1.65] text-muted [&_b]:font-medium [&_b]:text-text">
        This page is made of <b>five independent applications</b>, each with its own code, its own server and its own
        version. A <em>shell</em> composes them live so they look like one. And since each one deploys on its own, each
        also chooses how to render: <b>News</b> is built on the server on every visit (SSR), the <b>Guide</b> was
        generated once at build time (SSG), and the <b>Catalog</b> and <b>Details</b> are built in your browser (CSR).
        That's why the lesson explains each of them along the way.
      </p>
      <div className="mb-9 flex flex-wrap gap-2.5">
        <Button variant="primary" onClick={toggleInspector}>
          {inspector ? "Turn off the inspector" : "Turn on the inspector"}
        </Button>
        <a className={buttonClass("pill")} href="#demo">
          Go to the demo
        </a>
      </div>
      <RenderSheets />
    </section>
  );
}

function PreviewNote() {
  return (
    <p className="mb-7 max-w-[680px] rounded-[10px] border border-ssr/50 bg-ssr/8 px-3.5 py-3 text-sm">
      <b>Static preview.</b> The SSR server doesn't run here, so News shows a snapshot that server rendered before
      publishing. Catalog, details and guide are the real builds. To see SSR live, run <code>npm run dev</code> on your
      machine.
    </p>
  );
}
