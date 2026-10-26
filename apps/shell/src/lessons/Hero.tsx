import heroStudy560 from "../assets/hero-study-560.webp";
import heroStudy994 from "../assets/hero-study-994.webp";
import { environment } from "../mfe/registry.ts";
import { toggleInspector, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { buttonClass } from "../ui/button-class.ts";

/** The same box as the page below (and the top bar), so the hero's text lines up with them. */
const CONTAINER = "mx-auto w-[min(1180px,100%-32px)]";

/*
 * --art-w is the painting's width. Side by side: 42% of the screen, up to 600px, and never taller
 * than the screen minus the top bar and some air (that height, turned into a width with the image's
 * proportions). On an upright tablet it goes under the text, so it gets whatever height the text and
 * the buttons leave. On a phone it's smaller and the hero simply scrolls.
 */
const SIZES =
  "[--art-w:min(42vw,600px,(100svh_-_190px)*994/1119)] portrait-tablet:[--art-w:min(64vw,520px,(100svh_-_540px)*994/1119)] max-[700px]:[--art-w:min(80vw,320px)]";

/*
 * Side by side: the text and the buttons on the left, centered against the painting on the right.
 * Stacked (phone, upright tablet): one column, in reading order, with the painting before the
 * buttons; on the tablet it's centered, like a poster.
 */
const LAYOUT =
  "grid grid-cols-[minmax(0,1fr)_var(--art-w)] grid-rows-[1fr_auto_auto_1fr] gap-x-12 [grid-template-areas:'._art'_'text_art'_'cta_art'_'._art'] stacked:grid-cols-1 stacked:grid-rows-none stacked:[grid-template-areas:'text'_'art'_'cta'] portrait-tablet:text-center";

/** The floor: a line across the whole screen under the composition. The painting's desk stands on it. */
const FLOOR =
  "after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-screen after:-translate-x-1/2 after:bg-line after:content-['']";

const DOT_GRID =
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(var(--mfe-mid)_1px,transparent_1px)] before:bg-size-[18px_18px] before:opacity-20 before:[mask-image:linear-gradient(180deg,#000_10%,transparent_90%)] before:content-['']";

export function Hero() {
  const inspector = useStore((s) => s.inspector);
  return (
    // From a tablet up the hero fills the screen under the top bar (62px), so what follows only shows
    // when scrolling; the composition stays centered in it, with its floor.
    <section
      id="hero"
      aria-labelledby="hero-title"
      className={`relative flex min-h-[calc(100svh-62px)] flex-col max-[700px]:min-h-0 ${SIZES} ${DOT_GRID}`}
    >
      <PlateLine />
      <div className={`${CONTAINER} relative my-auto pt-12 ${LAYOUT} ${FLOOR}`}>
        <div className="[grid-area:text]">
          {environment() === "preview" && <PreviewNote />}
          <p className="mb-4 font-mono text-xs tracking-[.12em] text-muted uppercase">
            A lesson that is its own example
          </p>
          <h1
            id="hero-title"
            className="mb-7 font-serif text-[clamp(44px,6.4vw,86px)]/[.95] tracking-[-.025em] text-balance text-strong"
          >
            Anatomy of a <span className="whitespace-nowrap">micro-frontend</span>
          </h1>
          <p className="mb-9 max-w-[30rem] font-serif text-[clamp(19px,1.9vw,24px)]/[1.4] text-text stacked:mb-8 portrait-tablet:mx-auto [&_b]:font-medium">
            A project with two goals: to show how a <b className="whitespace-nowrap">micro-frontend</b> works from the
            inside, and to prove that <b>different kinds of rendering</b> can live together on one page.
          </p>
        </div>
        <HeroArt />
        <div className="flex flex-wrap gap-2.5 pb-12 [grid-area:cta] portrait-tablet:justify-center">
          <Button variant="primary" onClick={toggleInspector}>
            {inspector ? "Turn off the inspector" : "Turn on the inspector"}
          </Button>
          <a className={buttonClass("pill")} href="#demo">
            Go to the demo
          </a>
        </div>
        <RegistrationMark />
      </div>
    </section>
  );
}

/*
 * The painting studying a laptop (skull in hand, as anatomy demands). Side by side it stands on the
 * floor; stacked it goes, centered, between the text and the buttons. The browser picks the file for
 * the size and density of the screen: the 994px one is the image's full resolution, for retina.
 *
 * The PNG cuts the desk off on the right, in a straight line, so that side fades out. The gradient
 * is tilted: it starts just past the laptop's corner (81%, measured on the image) and grows towards
 * the bottom right, like light falling from the top left, so the laptop stays whole and the cut
 * dissolves. Behind it, a soft spotlight separates the dark wood from the page in dark mode. Stacked
 * there's no floor line under it, so a contact shadow takes its place.
 */
function HeroArt() {
  return (
    <div className="relative w-(--art-w) self-end [grid-area:art] stacked:mb-8 stacked:justify-self-center">
      <div
        aria-hidden="true"
        className="absolute inset-[-10%_-10%_-2%_-12%] bg-[radial-gradient(closest-side,var(--mfe-card),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--mfe-strong)_9%,transparent),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[2%] -bottom-1.5 left-[40%] hidden h-4 rounded-[50%] bg-black/20 blur-md dark:bg-black/70 stacked:block"
      />
      <img
        src={heroStudy560}
        srcSet={`${heroStudy560} 560w, ${heroStudy994} 994w`}
        sizes="(max-width: 700px) min(80vw, 320px), (orientation: portrait) and (max-width: 1100px) min(64vw, 520px), min(42vw, 600px)"
        width={994}
        height={1119}
        alt="A woman from a Baroque painting leans on a wooden desk, head in one hand and a skull in the other, puzzling over a laptop."
        fetchPriority="high"
        decoding="async"
        draggable={false}
        className="relative block h-auto w-full [mask-image:linear-gradient(105deg,#000_81%,transparent)] select-none"
      />
    </div>
  );
}

/**
 * A plate's margin line, like the ones in an anatomy book: 28px left of where the container starts.
 * It only fits when there's room beside the text.
 */
function PlateLine() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 left-[calc(max(16px,(100%_-_1180px)/2)_-_28px)] w-px bg-line-soft max-[1259px]:hidden"
    />
  );
}

/** Where the margin line meets the floor (it's drawn inside the container, 28px to its left). */
function RegistrationMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 11 11"
      className="absolute bottom-0 -left-7 size-[11px] -translate-x-1/2 translate-y-1/2 stroke-mid max-[1259px]:hidden"
    >
      <path d="M5.5 0v11M0 5.5h11" strokeWidth="1" />
    </svg>
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
