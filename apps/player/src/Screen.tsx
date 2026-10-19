import type { PlayDetail } from "@mfe/contracts";
import { progress, screenGradient } from "./format.ts";

interface ScreenProps {
  show: PlayDetail | null;
  position: number;
  paused: boolean;
}

// Sobre la pantalla: el texto siempre es claro, porque el fondo es oscuro en ambos temas.
const label = "ply:absolute ply:font-mono ply:text-[10px] ply:leading-[normal] ply:text-white";

/** La "pantalla": fondo con el tono del título, líneas de barrido, estado y barra de progreso. */
export function Screen({ show, position, paused }: ScreenProps) {
  return (
    <div
      className="ply:relative ply:aspect-video ply:overflow-hidden ply:rounded-[10px] ply:border ply:border-faint ply:bg-[#050505] ply:after:pointer-events-none ply:after:absolute ply:after:inset-0 ply:after:bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.035)_0_1px,transparent_1px_3px)] ply:after:content-['']"
      style={show ? { background: screenGradient(show.hue) } : undefined}
    >
      {show ? (
        <>
          <span className={`${label} ply:top-3 ply:left-3.5 ply:tracking-[.1em] ply:uppercase ply:opacity-75`}>
            {show.kind}
          </span>
          <span
            className={`${label} ply:top-2.5 ply:right-3 ply:flex ply:items-center ply:gap-1.5 ply:opacity-80`}
            role="status"
          >
            <i aria-hidden="true" className="ply:size-1.5 ply:animate-blink ply:rounded-full ply:bg-[#ff6b6b]" />
            {paused ? "en pausa" : "reproduciendo"}
          </span>
          <span className="ply:absolute ply:bottom-[30px] ply:left-3.5 ply:font-serif ply:text-[clamp(18px,3.4vw,28px)] ply:leading-[1.05] ply:font-semibold ply:text-white">
            {show.title}
          </span>
          <span
            role="progressbar"
            aria-label="Progreso"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress(position, show.length))}
            className="ply:absolute ply:inset-x-3.5 ply:bottom-3.5 ply:h-[3px] ply:rounded-[3px] ply:bg-white/18"
          >
            <b
              className="ply:block ply:h-full ply:rounded-[3px] ply:bg-white"
              style={{ width: `${progress(position, show.length)}%` }}
            />
          </span>
        </>
      ) : (
        <span className="ply:absolute ply:inset-0 ply:grid ply:place-items-center ply:p-4 ply:text-center ply:font-mono ply:text-[11px] ply:leading-[normal] ply:tracking-[.08em] ply:text-[#6e6e6e] ply:uppercase">
          <span>
            Esperando el evento mfe:play
            <br />
            elige algo en el catálogo
          </span>
        </span>
      )}
    </div>
  );
}
