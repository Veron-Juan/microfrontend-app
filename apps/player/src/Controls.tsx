import type { PlayDetail } from "@mfe/contracts";
import { clock } from "./format.ts";

interface ControlsProps {
  show: PlayDetail | null;
  position: number;
  latency: number | null;
  paused: boolean;
  onTogglePause: () => void;
}

/** Tiempo, origen del último evento y el botón de pausa. */
export function Controls({ show, position, latency, paused, onTogglePause }: ControlsProps) {
  return (
    <div className="ply:flex ply:flex-wrap ply:items-center ply:justify-between ply:gap-2.5 ply:font-mono ply:text-[11px] ply:leading-[normal] ply:text-muted">
      <span>{show ? `${clock(position)} / ${clock(show.length)}` : "--:-- / --:--"}</span>
      <span>{latency === null || !show ? "sin eventos aún" : `recibido de "${show.from}" en ${latency} ms`}</span>
      <button
        type="button"
        disabled={!show}
        onClick={onTogglePause}
        className="ply:m-0 ply:cursor-pointer ply:rounded-md ply:border ply:border-faint ply:bg-transparent ply:px-2.5 ply:py-1.5 ply:font-mono ply:text-[11px] ply:leading-[normal] ply:text-strong ply:disabled:cursor-default"
      >
        {paused ? "Reanudar" : "Pausa"}
      </button>
    </div>
  );
}
