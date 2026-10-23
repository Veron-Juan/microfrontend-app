import type { CSSProperties, ReactNode } from "react";
import type { RenderMode } from "@mfe/contracts";
import { cx } from "../lib/cx.ts";
import { apps, hostOf, type AppId } from "../mfe/registry.ts";
import { Chip } from "../ui/Chip.tsx";

/*
 * The page's five apps, each one as a "sheet" whose animation shows how it renders. The
 * illustrations are sized in cqw (container width), so they scale with the card without changing
 * shape. The animations live in styles.css (the ones starting with sh-).
 */

interface SheetInfo {
  /** What it does, in a few words. */
  text: string;
  Art: () => ReactNode;
}

const SHEETS: Record<AppId, SheetInfo> = {
  shell: {
    text: "The host. It builds the layout and mounts the other four in your browser, each in its place.",
    Art: ShellArt,
  },
  news: {
    text: "The server prints the HTML on every visit: the time changes every time; the data, when its 60 s cache expires.",
    Art: NewsArt,
  },
  catalog: {
    text: "JavaScript files arrive and React builds the grid on your screen.",
    Art: CatalogArt,
  },
  details: {
    text: "It listens for the catalog's event and fetches the data from TVmaze in your browser.",
    Art: DetailsArt,
  },
  guide: {
    text: "Printed once, at build time. The CDN hands everyone the same copy.",
    Art: GuideArt,
  },
};

export function RenderSheets() {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] tracking-[.12em] text-muted uppercase">
        The five apps, and how each one paints
      </p>
      <ul className="grid grid-cols-5 gap-3 max-[1180px]:grid-cols-3 max-[700px]:grid-cols-2 max-[440px]:grid-cols-1">
        {apps().map((app) => {
          const { text, Art } = SHEETS[app.id];
          return (
            <li
              key={app.id}
              data-render={app.render}
              className="group flex flex-col overflow-hidden rounded-xl border border-line-soft bg-card shadow-lift transition duration-300 ease-out-soft hover:-translate-y-1 hover:border-(--c)/50"
            >
              <div
                data-sheet-art
                aria-hidden="true"
                className="@container relative m-1.5 mb-0 aspect-[4/3] overflow-hidden rounded-lg bg-page bg-[radial-gradient(var(--mfe-faint)_1px,transparent_1px)] bg-size-[10px_10px] ring-1 ring-line-soft"
              >
                <Art />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3.5 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <b className="text-[13.5px] font-semibold text-strong">{app.title}</b>
                  <Chip render={app.render} />
                </div>
                <p className="text-[12.5px]/snug text-text">{text}</p>
                <span className="mt-auto grid pt-1 font-mono text-[10.5px]/[1.5] text-muted">
                  <span className="text-text">{app.name}</span>
                  <span>{hostOf(app.url)}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Shared pieces ────────────────────────────────────────────────────────────────

/** A sheet of paper: the surface each illustration is "printed" on. */
function Sheet({ className, style, children }: { className: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div
      className={cx(
        "absolute rounded-t-[2.5cqw] bg-card shadow-[0_2cqw_6cqw_-2cqw_rgb(0_0_0/.28)] ring-1 ring-line-soft",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/** A drawn line of text. */
function Bar({ className }: { className: string }) {
  return <i className={cx("block h-[2.2cqw] rounded-full", className)} />;
}

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

// ── Shell: composes ──────────────────────────────────────────────────────────────

function ShellArt() {
  return (
    <Sheet className="inset-x-[15cqw] top-[9cqw] bottom-[-4cqw] p-[4.5cqw]">
      <div className="mb-[3.5cqw] flex items-center gap-[2cqw]">
        <i className="size-[3cqw] rounded-[0.8cqw] bg-strong/85" />
        <Bar className="w-[16cqw] bg-line" />
        <i className="ml-auto size-[3cqw] rounded-full bg-linear-135 from-csr to-ssg" />
      </div>
      <div className="grid gap-[2.4cqw]">
        <MountSlot render="SSR" order={0} className="h-[10cqw]" />
        <div className="grid grid-cols-[3fr_2fr] gap-[2.4cqw]">
          <MountSlot render="CSR" order={1} className="h-[17cqw]" />
          <MountSlot render="CSR" order={2} className="h-[17cqw]" />
        </div>
        <MountSlot render="SSG" order={3} className="h-[10cqw]" />
      </div>
    </Sheet>
  );
}

function MountSlot({ render, order, className }: { render: RenderMode; order: number; className: string }) {
  return (
    <div className={cx("relative rounded-[1.6cqw] border border-dashed border-line", className)}>
      <span
        data-render={render}
        className="absolute -inset-px animate-sh-mount rounded-[1.6cqw] bg-(--c)/20 ring-1 ring-(--c)/60"
        style={delay(0.3 + order * 0.45)}
      />
    </div>
  );
}

// ── SSR: prints on every request ─────────────────────────────────────────────────

/** The times the sheet shows: a different one per request. */
const TIMES = ["12:08:19", "12:08:22", "12:08:25", "12:08:28"];

function NewsArt() {
  return (
    <>
      <span className="absolute top-[9.5cqw] left-[3cqw] z-20 animate-sh-request rounded-[1.2cqw] bg-ssr px-[1.6cqw] py-[0.6cqw] font-mono text-[3.4cqw]/none font-semibold text-card opacity-0">
        GET
      </span>
      <div className="absolute inset-x-[13cqw] top-[6cqw] z-10 flex h-[13cqw] items-center gap-[1.6cqw] rounded-[2cqw] bg-[#1b1b1d] px-[3cqw] shadow-[0_2cqw_4cqw_-2cqw_rgb(0_0_0/.5)] ring-1 ring-white/10">
        <i className="size-[2cqw] animate-sh-led rounded-full bg-ssr" />
        <i className="size-[2cqw] rounded-full bg-ssr/35" />
        <span className="ml-auto font-mono text-[2.8cqw] tracking-[.1em] text-white/55 uppercase">server</span>
      </div>
      {/* The sheet comes out from under the server: the container clips what hasn't come out yet. */}
      <div className="absolute inset-x-[18cqw] top-[17cqw] bottom-0 overflow-hidden">
        <Sheet className="inset-x-0 top-0 h-[62cqw] animate-sh-print p-[4cqw]">
          <div className="mb-[3cqw] flex items-center justify-between">
            <Bar className="w-[18cqw] bg-strong/70" />
            <span className="h-[4.6cqw] overflow-hidden rounded-[1cqw] bg-ssr/12 px-[1.4cqw] font-mono text-[3.3cqw]/[4.6cqw] text-ssr">
              <span className="block animate-sh-odometer">
                {TIMES.map((time) => (
                  <span key={time} className="block">
                    {time}
                  </span>
                ))}
              </span>
            </span>
          </div>
          <div className="grid gap-[2.2cqw]">
            {["w-full", "w-[86%]", "w-[93%]", "w-[62%]", "w-[80%]", "w-[70%]"].map((width, index) => (
              <i
                key={width}
                className={cx("block h-[2.2cqw] origin-left animate-sh-ink rounded-full bg-line", width)}
                style={delay(index * 0.06)}
              />
            ))}
          </div>
        </Sheet>
      </div>
    </>
  );
}

// ── CSR: built in the browser ────────────────────────────────────────────────────

// React isn't here: the catalog uses the copy the shell already loaded (see "Shared dependencies").
const CHUNKS = ["remoteEntry.js", "catalog.js", "a3f.js"];
const TILES = [
  "from-csr/70 to-csr/25",
  "from-csr/45 to-csr/15",
  "from-csr/60 to-csr/20",
  "from-csr/35 to-csr/10",
  "from-csr/50 to-csr/15",
  "from-csr/30 to-csr/10",
  "from-csr/65 to-csr/25",
  "from-csr/40 to-csr/15",
];

function CatalogArt() {
  return (
    <>
      {CHUNKS.map((name, index) => (
        <span
          key={name}
          className="absolute top-[3cqw] z-20 animate-sh-chunk rounded-[1.2cqw] bg-card px-[1.6cqw] py-[0.6cqw] font-mono text-[3.1cqw]/none text-csr opacity-0 ring-1 ring-csr/45"
          style={{ left: `${4 + index * 31}cqw`, ...delay(index * 0.18) }}
        >
          {name}
        </span>
      ))}
      <Sheet className="inset-x-[10cqw] top-[13cqw] bottom-[-4cqw] p-[3.5cqw]">
        <div className="mb-[3cqw] flex items-center gap-[1.2cqw]">
          {[0, 1, 2].map((dot) => (
            <i key={dot} className="size-[1.8cqw] rounded-full bg-line" />
          ))}
          <i className="ml-[1.5cqw] h-[2.4cqw] flex-1 rounded-full bg-line-soft" />
        </div>
        <div className="grid grid-cols-4 gap-[2cqw]">
          {TILES.map((tile, index) => (
            <span
              key={tile}
              className="relative aspect-[2/3] animate-sh-pop rounded-[1.2cqw]"
              style={delay(index * 0.07)}
            >
              <span className={cx("absolute inset-0 rounded-[1.2cqw] bg-linear-160", tile)} />
              {index === 1 && <span className="absolute inset-0 animate-sh-pick rounded-[1.2cqw]" />}
            </span>
          ))}
        </div>
      </Sheet>
      {/* The cursor picks the second title. */}
      <svg
        viewBox="0 0 16 16"
        className="absolute top-[31cqw] left-[38cqw] z-20 size-[7cqw] animate-sh-cursor opacity-0 drop-shadow-[0_1px_1px_rgb(0_0_0/.3)]"
      >
        <path
          d="M3 2l9.5 6.2-4.2.8 2.3 4.6-1.9.9-2.3-4.6L3 12.6z"
          className="fill-strong stroke-card"
          strokeWidth="1"
        />
      </svg>
    </>
  );
}

// ── Details: listens for an event and fetches the data ───────────────────────────

function DetailsArt() {
  return (
    <>
      <span className="absolute top-[24cqw] left-[3cqw] z-20 animate-sh-tag rounded-[1.2cqw] bg-csr px-[1.6cqw] py-[0.6cqw] font-mono text-[3cqw]/none text-white opacity-0">
        mfe:select
      </span>
      <span className="absolute top-[34cqw] left-[3cqw] w-[26cqw] border-t border-dashed border-csr/50" />
      <span
        className="absolute top-[32.5cqw] left-[3cqw] z-20 size-[3cqw] animate-sh-event rounded-full bg-csr opacity-0 shadow-[0_0_0_1cqw_color-mix(in_srgb,var(--mfe-csr)_25%,transparent)]"
        style={{ "--travel": "24cqw" } as CSSProperties}
      />
      <span className="absolute top-[4cqw] right-[4cqw] z-20 flex items-center gap-[1cqw] rounded-full bg-card px-[2cqw] py-[0.8cqw] font-mono text-[3cqw]/none text-text ring-1 ring-line">
        <i className="size-[1.6cqw] rounded-full bg-csr" />
        TVmaze
      </span>
      {/* The API request and its response. */}
      <span
        className="absolute top-[17cqw] left-[72cqw] z-20 size-[2.4cqw] animate-sh-roundtrip rounded-full bg-csr opacity-0"
        style={{ "--tx": "12cqw", "--ty": "-11cqw" } as CSSProperties}
      />
      <Sheet className="top-[16cqw] right-[6cqw] bottom-[-4cqw] left-[30cqw] p-[3.5cqw]">
        <div className="grid *:col-start-1 *:row-start-1">
          {/* While the data arrives: the skeleton. */}
          <div className="grid animate-sh-skeleton grid-cols-[14cqw_1fr] gap-[2.5cqw] opacity-0">
            <span className="aspect-[2/3] rounded-[1.2cqw] bg-faint" />
            <span className="grid content-start gap-[2cqw] pt-[1cqw]">
              <Bar className="w-full bg-faint" />
              <Bar className="w-3/4 bg-faint" />
              <Bar className="w-1/2 bg-faint" />
            </span>
          </div>
          {/* With the data. */}
          <div className="grid animate-sh-filled grid-cols-[14cqw_1fr] gap-[2.5cqw]">
            <span className="aspect-[2/3] rounded-[1.2cqw] bg-linear-160 from-csr/80 to-csr/30" />
            <span className="grid content-start gap-[1.8cqw] pt-[1cqw]">
              <Bar className="h-[3cqw] w-full bg-strong/75" />
              <Bar className="w-3/4 bg-line" />
              <span className="font-mono text-[3.4cqw]/none text-[#f5a524]">★★★★</span>
            </span>
          </div>
        </div>
        <div className="mt-[3cqw] grid animate-sh-filled grid-cols-3 gap-[1.6cqw]" style={delay(0.15)}>
          {[0, 1, 2].map((box) => (
            <span key={box} className="h-[7cqw] rounded-[1cqw] ring-1 ring-line" />
          ))}
        </div>
      </Sheet>
    </>
  );
}

// ── SSG: printed once, handed out the same ───────────────────────────────────────

/** The sheet's heat map: flat data, always the same. */
const HEAT = [2, 1, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 2, 1, 3, 4, 4, 2, 1, 2, 3, 1, 3, 4, 3, 2, 4, 1, 2];
const LEVELS = ["bg-ssg/12", "bg-ssg/28", "bg-ssg/48", "bg-ssg/72", "bg-ssg"];
const SCREENS = [
  { top: 12, ty: -18.5 },
  { top: 31, ty: 0.5 },
  { top: 50, ty: 19.5 },
];

function GuideArt() {
  return (
    <>
      <Sheet className="top-[17cqw] left-[11cqw] h-[56cqw] w-[44cqw] rotate-[-5deg] opacity-55" />
      <Sheet className="top-[14cqw] left-[9cqw] h-[56cqw] w-[44cqw] rotate-[-2.5deg] opacity-80" />
      <Sheet className="top-[11cqw] left-[7cqw] h-[56cqw] w-[44cqw] p-[3.5cqw]">
        <Bar className="mb-[1.6cqw] w-[22cqw] bg-strong/70" />
        <Bar className="mb-[3cqw] w-[14cqw] bg-line" />
        <div className="grid grid-cols-6 gap-[1cqw]">
          {HEAT.map((level, index) => (
            <i key={index} className={cx("aspect-square rounded-[0.8cqw]", LEVELS[level])} />
          ))}
        </div>
        <span className="absolute right-[-3cqw] bottom-[9cqw] rotate-[-10deg] rounded-[1cqw] border-[0.5cqw] border-ssg bg-card/85 px-[1.4cqw] py-[0.4cqw] font-mono text-[3cqw]/none font-bold tracking-[.06em] text-ssg uppercase">
          build ✓
        </span>
      </Sheet>
      <span className="absolute top-[5cqw] right-[10cqw] font-mono text-[2.8cqw] tracking-[.14em] text-muted uppercase">
        CDN
      </span>
      {SCREENS.map((screen, index) => (
        <span
          key={screen.top}
          className="absolute right-[6cqw] h-[14cqw] w-[20cqw] overflow-hidden rounded-[1.6cqw] bg-card ring-1 ring-line"
          style={{ top: `${screen.top}cqw` }}
        >
          <span
            className="absolute inset-0 grid animate-sh-arrive place-items-center bg-ssg/22 font-mono text-[4cqw] font-bold text-ssg"
            style={delay(index * 0.45)}
          >
            ✓
          </span>
        </span>
      ))}
      {SCREENS.map((screen, index) => (
        <span
          key={screen.top}
          className="absolute top-[30cqw] left-[23cqw] z-20 grid h-[15cqw] w-[12cqw] animate-sh-deliver content-start gap-[1cqw] rounded-[1cqw] bg-card p-[1.4cqw] opacity-0 shadow-[0_1.5cqw_3cqw_-1cqw_rgb(0_0_0/.35)] ring-1 ring-ssg/50"
          style={{ "--tx": "53cqw", "--ty": `${screen.ty}cqw`, ...delay(index * 0.45) } as CSSProperties}
        >
          <i className="h-[1.4cqw] rounded-full bg-ssg/60" />
          <i className="h-[1.4cqw] w-3/4 rounded-full bg-ssg/35" />
          <i className="h-[1.4cqw] rounded-full bg-ssg/35" />
        </span>
      ))}
    </>
  );
}
