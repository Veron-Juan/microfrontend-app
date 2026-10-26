/** @jsxRuntime automatic */
// A React component that only runs on the server. The browser receives HTML that's already built.
// (The pragma above pins the JSX runtime even when tsx doesn't see this tsconfig, e.g. in the tests.)
import type { ReactNode } from "react";
import type { Feed, LiveData } from "./live-data.ts";
import { phaseOf, SPORTSDB_SITE, statusLabel, type Match } from "./sportsdb.ts";
import { TVMAZE_SITE, type Premiere } from "./tvmaze.ts";

export interface NewsProps extends LiveData {
  rendered: string;
  requestId: string;
  served: number;
  timing: { data: number; render: number };
  /** How a match's kickoff time is shown ("21:30"). */
  formatTime: (iso: string) => string;
}

const caption =
  "nws:m-0 nws:mb-2 nws:font-mono nws:text-[10px] nws:leading-[normal] nws:tracking-[.08em] nws:text-muted nws:uppercase";
const tile = "nws:rounded-xl nws:border nws:border-faint nws:bg-page/60";
const notice =
  "nws:m-0 nws:rounded-xl nws:border nws:border-dashed nws:border-faint nws:px-3 nws:py-4 nws:text-[13px] nws:text-muted";

export function News({ rendered, requestId, served, timing, matches, premieres, formatTime }: NewsProps) {
  return (
    <section className="nws:grid nws:gap-4 nws:font-sans" data-request={requestId}>
      <header className="nws:flex nws:min-h-8 nws:flex-wrap nws:items-center nws:justify-between nws:gap-x-3 nws:gap-y-1">
        <h3 className="nws:m-0 nws:text-[15px] nws:font-semibold nws:tracking-[-.01em] nws:text-strong">Live news</h3>
        <span className="nws:font-mono nws:text-[11px] nws:leading-[normal] nws:text-muted">
          rendered on the server at <b className="nws:font-medium nws:text-ssr">{rendered}</b>
        </span>
      </header>
      <div className="nws:grid nws:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] nws:gap-5 nws:max-md:grid-cols-1">
        <div>
          <p className={caption}>Football today</p>
          <FeedList feed={matches} empty="No matches scheduled for today." as="ul">
            {matches.items.map((match) => (
              <MatchCard key={match.id} match={match} formatTime={formatTime} />
            ))}
          </FeedList>
        </div>
        <div>
          <p className={caption}>Streaming today</p>
          <FeedList feed={premieres} empty="No streaming premieres today." as="ol">
            {premieres.items.map((item) => (
              <PremiereCard key={item.id} item={item} />
            ))}
          </FeedList>
        </div>
      </div>
      <footer className="nws:flex nws:flex-wrap nws:items-center nws:gap-x-4 nws:gap-y-1.5 nws:border-t nws:border-faint nws:pt-3 nws:font-mono nws:text-[11px] nws:leading-[normal] nws:text-muted">
        <span>
          request{" "}
          <code className="nws:rounded nws:bg-faint/60 nws:px-1.5 nws:py-0.5 nws:font-mono nws:text-strong">
            {requestId}
          </code>
        </span>
        <span>request #{served} on this server</span>
        <span>APIs {timing.data} ms</span>
        <span>
          data: <Credit href={SPORTSDB_SITE} name="TheSportsDB" feed={matches} /> ·{" "}
          <Credit href={TVMAZE_SITE} name="TVmaze" feed={premieres} />
        </span>
      </footer>
    </section>
  );
}

const STATUS_CLASSES = {
  upcoming: "nws:bg-ssr/12 nws:text-ssr",
  live: "nws:bg-danger/12 nws:text-danger",
  finished: "nws:bg-faint nws:text-muted",
  other: "nws:bg-faint nws:text-muted",
} as const;

/** A match as on a scoreboard: the league, the status and one row per team with its badge and goals. */
function MatchCard({ match, formatTime }: { match: Match; formatTime: (iso: string) => string }) {
  const phase = phaseOf(match);
  const [home, away] = match.goals ?? [null, null];
  return (
    <li className={`${tile} nws:grid nws:gap-2 nws:px-3 nws:py-2.5`}>
      <div className="nws:flex nws:items-center nws:justify-between nws:gap-2">
        <span className="nws:truncate nws:text-[11px] nws:text-muted" title={match.league}>
          {match.league}
        </span>
        <span
          className={`nws:inline-flex nws:shrink-0 nws:items-center nws:gap-1.5 nws:rounded-full nws:px-2 nws:py-0.5 nws:font-mono nws:text-[10.5px] nws:leading-[normal] nws:font-medium ${STATUS_CLASSES[phase]}`}
        >
          {phase === "live" && (
            <i className="nws:size-1.5 nws:animate-live nws:rounded-full nws:bg-danger" aria-hidden="true" />
          )}
          <span>{statusLabel(match, formatTime)}</span>
        </span>
      </div>
      <TeamRow name={match.home} badge={match.badges[0]} goals={home} winner={home !== null && home > (away ?? 0)} />
      <TeamRow name={match.away} badge={match.badges[1]} goals={away} winner={away !== null && away > (home ?? 0)} />
    </li>
  );
}

interface TeamRowProps {
  name: string;
  badge: string | null;
  goals: number | null;
  winner: boolean;
}

function TeamRow({ name, badge, goals, winner }: TeamRowProps) {
  return (
    <div className="nws:grid nws:grid-cols-[22px_minmax(0,1fr)_auto] nws:items-center nws:gap-2.5">
      {badge ? (
        <img src={badge} alt="" width={22} height={22} loading="lazy" className="nws:size-5.5 nws:object-contain" />
      ) : (
        <span
          aria-hidden="true"
          className="nws:grid nws:size-5.5 nws:place-items-center nws:rounded-full nws:bg-faint nws:text-[10px] nws:font-semibold nws:text-muted"
        >
          {name.charAt(0)}
        </span>
      )}
      <span
        className={`nws:truncate nws:text-[13.5px] ${winner ? "nws:font-semibold nws:text-strong" : "nws:text-text"}`}
      >
        {name}
      </span>
      <b
        className={`nws:font-mono nws:text-[15px] nws:leading-[normal] nws:tabular-nums ${goals === null ? "nws:font-normal nws:text-muted" : "nws:font-semibold nws:text-strong"}`}
      >
        {goals ?? "–"}
      </b>
    </div>
  );
}

/**
 * A show's poster. It's a background over a placeholder with the initial rather than an <img>: if
 * TVmaze has no poster, or its URL is broken, nothing paints and the placeholder shows instead of
 * the broken-image icon. (The fragment can't use onerror: the shell's CSP doesn't run inline handlers.)
 */
function Poster({ src, show }: { src: string | null; show: string }) {
  return (
    <span
      aria-hidden="true"
      className="nws:grid nws:aspect-[2/3] nws:w-11.5 nws:overflow-hidden nws:rounded-md nws:*:col-start-1 nws:*:row-start-1"
    >
      <span className="nws:grid nws:place-items-center nws:bg-faint nws:font-serif nws:text-lg nws:text-muted">
        {show.charAt(0)}
      </span>
      {src && (
        <span className="nws:bg-cover nws:bg-center" style={{ backgroundImage: `url(${JSON.stringify(src)})` }} />
      )}
    </span>
  );
}

/** A premiere: the poster, the title, the episode and the platform. */
function PremiereCard({ item }: { item: Premiere }) {
  return (
    <li className={`${tile} nws:grid nws:grid-cols-[46px_minmax(0,1fr)] nws:items-center nws:gap-3 nws:p-2 nws:pr-3`}>
      <Poster src={item.image} show={item.show} />
      <div className="nws:grid nws:min-w-0 nws:gap-1">
        <b className="nws:truncate nws:font-serif nws:text-[16px] nws:leading-[1.2] nws:font-semibold nws:text-strong">
          {item.show}
        </b>
        <span className="nws:flex nws:flex-wrap nws:items-center nws:gap-1.5 nws:font-mono nws:text-[11px] nws:leading-[normal] nws:text-muted">
          {item.episode && <span>{item.episode}</span>}
          {item.platform && (
            <span className="nws:rounded-full nws:border nws:border-faint nws:bg-card nws:px-1.5 nws:py-px nws:font-sans nws:text-text">
              {item.platform}
            </span>
          )}
        </span>
      </div>
    </li>
  );
}

interface FeedListProps {
  feed: Feed<unknown>;
  empty: string;
  as: "ul" | "ol";
  children: ReactNode;
}

/** A source's list, or a notice if the API failed or returned nothing. */
function FeedList({ feed, empty, as: List, children }: FeedListProps) {
  if (!feed.ok) return <p className={notice}>The source didn't respond. The rest of the fragment keeps working.</p>;
  if (feed.items.length === 0) return <p className={notice}>{empty}</p>;
  return <List className="nws:m-0 nws:grid nws:list-none nws:gap-2 nws:p-0">{children}</List>;
}

/** A source's credit, with the age of its data: that's how you see the cache at work. */
function Credit({ href, name, feed }: { href: string; name: string; feed: Feed<unknown> }) {
  const age = !feed.ok ? "no response" : feed.age === 0 ? "just fetched" : `${feed.age} s old`;
  return (
    <>
      <a href={href} className="nws:text-text nws:underline nws:underline-offset-2">
        {name}
      </a>{" "}
      ({age})
    </>
  );
}
