import { useEffect, useRef, useState } from "react";
import { FIGURES } from "@mfe/figures/figures";
import { corners, segment, translateAlong, type Plan, type Projection } from "@mfe/figures/kit";
import { appById, remoteById, type AppId, type RemoteId } from "../mfe/registry.ts";
import { setFocus, store, useStore } from "../state/store.ts";
import { part, prefersReducedMotion, say } from "./dom.ts";
import { PlaybackControls } from "./PlaybackControls.tsx";
import { Plate } from "./Plate.tsx";
import { easeInOutCubic } from "./render-model.ts";
import { useAnimationLoop } from "./use-animation-loop.ts";

const { P, HOVER, TILES } = FIGURES.assembly.data;

/** Sequence timings, in seconds. */
const SHELL_FIRST = 1.1; // the empty page, with only the shell
const REQUEST = 0.6; // the pieces appear up top: the shell requested them
const SPREAD = 2.4; // the slowest piece arrives this long after being requested
const DROP = 0.55;
const HOLD = 3.2;
const FADE = 0.5;

interface Run {
  t: number;
  /** When each piece drops, based on how long its remote took on this page. */
  land: Record<string, number>;
}

function startRun(): Run {
  const { loads } = store.get();
  const ms = TILES.map((tile) => loads[tile.id as AppId]?.ms ?? 1);
  const longest = Math.max(...ms, 1);
  const land = Object.fromEntries(
    TILES.map((tile, i) => [tile.id, SHELL_FIRST + REQUEST + ((ms[i] ?? 1) / longest) * SPREAD]),
  );
  return { t: 0, land };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The drawing always shows each app's local port: production origins are long, don't fit on the
 * pieces, and localhost:500x makes it clearer that these are five different servers.
 */
const LOCAL_PORT: Record<AppId, number> = { shell: 5000, catalog: 5001, details: 5002, news: 5003, guide: 5004 };
const localHost = (id: AppId) => `localhost:${LOCAL_PORT[id]}`;

/**
 * What opens when a piece is clicked: the manifest for Module Federation, otherwise its page. The
 * SSG one asks for index.html by name, the file itself: its host serves it at / only through a
 * rewrite (its _redirects, since html_handling "none" serves /fragment/guide.html as is).
 */
function linkOf(id: AppId) {
  const app = appById(id);
  if (app.kind === "federated") return app.entry;
  return app.render === "SSG" ? new URL("index.html", app.url).href : app.url;
}

// Fig 1: an exploded view of the demo. The shell lays out the page and each remote drops into its slot on arrival.
export function AssemblyFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const run = useRef<Run>(startRun());
  const [paused, setPaused] = useState(false);
  const settled = useStore((s) =>
    TILES.every((tile) => ["ready", "error"].includes(s.loads[tile.id as AppId]?.status ?? "idle")),
  );
  const restart = () => {
    run.current = startRun();
    setPaused(false);
  };

  // The first loop is built from the measured timings, so it starts over once the loads finish.
  useEffect(() => {
    if (settled) run.current = startRun();
  }, [settled]);

  useEffect(() => {
    const svg = stage.current;
    if (svg) say(part(svg, "origin-shell"), `${localHost("shell")} · layout and navigation`);
  }, []);

  // Each piece, and the shell's label, is a link to what its server serves in this environment.
  useEffect(() => {
    const svg = stage.current;
    if (!svg) return undefined;
    const slotOf = (event: Event) => (event.target as Element).closest<SVGElement>("[data-slot]")?.dataset.slot;
    const open = (id: string) => window.open(linkOf(id as AppId), "_blank", "noopener");
    for (const group of svg.querySelectorAll<SVGElement>("[data-slot]")) {
      const id = group.dataset.slot as AppId;
      group.setAttribute("role", "link");
      group.setAttribute("tabindex", "0");
      group.setAttribute("aria-label", `${appById(id).title}: open ${linkOf(id)} in a new tab`);
    }
    const click = (event: MouseEvent) => {
      const id = slotOf(event);
      if (!id) return;
      open(id);
      // When coming back from the other tab the piece shouldn't stay focused or highlighted.
      (event.target as Element).closest<SVGElement>("[data-slot]")?.blur();
      setFocus(null);
    };
    const key = (event: KeyboardEvent) => {
      const id = slotOf(event);
      if (id && event.key === "Enter") open(id);
    };
    svg.addEventListener("click", click);
    svg.addEventListener("keydown", key);
    return () => {
      svg.removeEventListener("click", click);
      svg.removeEventListener("keydown", key);
    };
  }, []);

  // Hovering over a piece, or reaching it with Tab, highlights its remote across the whole page.
  // It listens to pointermove rather than pointerover so it highlights again after returning from another tab.
  useEffect(() => {
    const svg = stage.current;
    if (!svg) return undefined;
    const show = (id: AppId | null) => {
      if (store.get().focus !== id) setFocus(id);
    };
    const enter = (event: Event) => {
      const group = (event.target as Element).closest<SVGElement>("[data-slot]");
      show(group ? (group.dataset.slot as AppId) : null);
    };
    const leave = () => show(null);
    svg.addEventListener("pointermove", enter);
    svg.addEventListener("pointerleave", leave);
    svg.addEventListener("focusin", enter);
    svg.addEventListener("focusout", leave);
    return () => {
      svg.removeEventListener("pointermove", enter);
      svg.removeEventListener("pointerleave", leave);
      svg.removeEventListener("focusin", enter);
      svg.removeEventListener("focusout", leave);
    };
  }, []);

  useAnimationLoop(stage, readout, (dt, svg, out) => {
    const { loads, focus } = store.get();
    const still = prefersReducedMotion();
    const r = run.current;
    // While paused time doesn't advance, but it keeps drawing so highlights and outages still show.
    if (!paused) r.t += dt;
    const t = still ? Infinity : r.t;
    const lastLand = Math.max(...Object.values(r.land));
    // At the end of the loop the pieces fade out and the page is empty again.
    const fade = still ? 1 : 1 - clamp((t - lastLand - DROP - HOLD) / FADE);
    const shown = still ? 1 : clamp((t - SHELL_FIRST) / REQUEST);

    let landed = 0;
    let latest: { id: AppId; at: number } | null = null;
    for (const tile of TILES) {
      const id = tile.id as AppId;
      const status = loads[id]?.status ?? "idle";
      const failed = status === "error";
      // A piece only drops if its remote really loaded: if it's loading or down it stays up top.
      const drop = status === "ready" ? easeInOutCubic(clamp((t - (r.land[tile.id] ?? 0)) / DROP)) : 0;
      const height = HOVER * (1 - drop);
      const home = drop === 1;
      if (home) {
        landed += 1;
        const at = r.land[tile.id] ?? 0;
        if (!latest || at > latest.at) latest = { id, at };
      }

      const group = part(svg, `tile-${tile.id}`);
      group.setAttribute("transform", translateAlong(P, [0, 0, height]));
      group.style.opacity = String((failed ? 0.4 : 1) * shown * fade);
      group.toggleAttribute("data-landed", home);
      group.querySelector(".iso-solid")?.toggleAttribute("data-lit", focus === id);
      part(svg, `ring-${tile.id}`).dataset.on = String(home);
      const app = remoteById(tile.id as RemoteId);
      say(part(svg, `meta-${tile.id}`), `${failed ? "no response" : app.render} · ${localHost(app.id)}`);

      const lines = part(svg, `guides-${tile.id}`);
      lines.setAttribute("d", guides(P, tile.plan, height));
      lines.style.opacity = String(shown * fade);
      lines.toggleAttribute("data-flow", status === "loading" && !still && !paused);

      const shadow = part(svg, `shadow-${tile.id}`);
      shadow.style.opacity = String(drop * fade);
      part(svg, `slot-${tile.id}`).style.opacity = String(home ? 0 : 1);
      part(svg, `fail-${tile.id}`).dataset.on = String(failed && shown > 0);
    }
    say(out, readoutText(t, landed, latest?.id));
    if (!still && fade === 0) run.current = startRun();
  });

  return (
    <Plate
      fig="Fig 1"
      title="One page, five servers"
      hint="Click a piece to open it"
      readoutRef={readout}
      stageRef={stage}
      svg={FIGURES.assembly.svg}
      label="Exploded view of the demo: the shell lays out the page and each remote drops into its slot on arrival. Each piece opens its server in a new tab."
      controls={<PlaybackControls paused={paused} onToggle={() => setPaused(!paused)} onReplay={restart} />}
      keys={[
        { render: "SSR", label: "News: HTML made on every request (SSR)" },
        { render: "CSR", label: "Catalog and Details: built in the browser (CSR)" },
        { render: "SSG", label: "Guide: HTML generated at build time (SSG)" },
      ]}
      caption="At the bottom, the page the shell lays out: the frame, the navigation and a dotted slot per remote. Above it, the four pieces it requests, each from its own server. Each piece drops into place when it arrives, in the order and with the timings measured on this page. If you kill a server from the inspector, its piece stays up top, its slot shows the notice and the rest of the page is built anyway."
    />
  );
}

function readoutText(t: number, landed: number, latest: AppId | undefined) {
  const { loads, focus } = store.get();
  if (focus && focus !== "shell") {
    const app = appById(focus);
    const load = loads[focus];
    const state = load?.status === "ready" ? `${load.ms} ms` : load?.status === "error" ? "down" : "loading";
    return `${app.title} · ${app.render} · ${state}`;
  }
  const failed = TILES.filter((tile) => loads[tile.id as AppId]?.status === "error").length;
  if (t < SHELL_FIRST) return "1 · the shell lays out the page and its slots";
  if (landed === 0) return `2 · requests ${TILES.length} remotes, each from its server`;
  if (landed + failed < TILES.length && latest)
    return `3 · ${appById(latest).title} arrived · ${landed}/${TILES.length}`;
  return failed
    ? `${landed}/${TILES.length} in place · ${failed} down, the rest works`
    : `${landed}/${TILES.length} remotes in place`;
}

/** The vertical edges joining a piece at height z to its slot, like in an assembly drawing. */
function guides(projection: Projection, plan: Plan, z: number) {
  if (z < 0.5) return "";
  return corners(plan, 1)
    .map(([x, y]) => segment([x, y, z], [x, y, 0], projection))
    .join("");
}
