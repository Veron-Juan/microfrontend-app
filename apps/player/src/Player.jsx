import React, { useEffect, useRef, useState } from "react";

export const meta = { name: "player", version: "2.1.3", team: "Equipo Reproducción", render: "CSR" };

const CSS = `
.ply{font-family:Inter,system-ui,sans-serif;display:grid;gap:12px}
.ply-screen{position:relative;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#050505;border:1px solid var(--anatomy-faint,#2a2a2a)}
.ply-screen::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);pointer-events:none}
.ply-idle{position:absolute;inset:0;display:grid;place-items:center;color:#6e6e6e;font:11px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;text-align:center;padding:16px}
.ply-title{position:absolute;left:14px;bottom:30px;color:#fff;font:600 clamp(18px,3.4vw,28px)/1.05 "EB Garamond",Georgia,serif}
.ply-kind{position:absolute;left:14px;top:12px;font:10px ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:#fff;opacity:.75}
.ply-live{position:absolute;right:12px;top:10px;display:flex;gap:6px;align-items:center;font:10px ui-monospace,monospace;color:#fff;opacity:.8}
.ply-live i{width:6px;height:6px;border-radius:50%;background:#ff6b6b;animation:ply-blink 1.4s infinite}
@keyframes ply-blink{50%{opacity:.25}}
.ply-bar{position:absolute;left:14px;right:14px;bottom:14px;height:3px;background:rgba(255,255,255,.18);border-radius:3px}
.ply-bar b{display:block;height:100%;background:#fff;border-radius:3px}
.ply-ctrl{display:flex;justify-content:space-between;align-items:center;gap:10px;font:11px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90);flex-wrap:wrap}
.ply-ctrl button{font:11px ui-monospace,monospace;padding:6px 10px;border-radius:6px;border:1px solid var(--anatomy-faint,#2a2a2a);background:transparent;color:var(--anatomy-strong,#e6e6e6);cursor:pointer}
`;

const clock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function Player() {
  const [show, setShow] = useState(null);
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const [latency, setLatency] = useState(null);
  const frame = useRef(0);

  // El reproductor solo conoce el contrato del evento, no al emisor.
  useEffect(() => {
    const onPlay = (event) => {
      setShow(event.detail);
      setPosition(0);
      setPaused(false);
      setLatency(Date.now() - event.detail.at);
    };
    window.addEventListener("mfe:play", onPlay);
    return () => window.removeEventListener("mfe:play", onPlay);
  }, []);

  useEffect(() => {
    if (!show || paused) return undefined;
    let last = performance.now();
    const tick = (now) => {
      // Avanza 60× más rápido que el tiempo real para que se note el progreso.
      setPosition((value) => Math.min(show.length, value + ((now - last) / 1000) * 60));
      last = now;
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [show, paused]);

  return (
    <section className="ply">
      <style>{CSS}</style>
      <div className="ply-screen" style={show ? { background: `radial-gradient(120% 90% at 20% 10%,hsl(${show.hue} 50% 30%),#050505 70%)` } : undefined}>
        {show ? (
          <>
            <span className="ply-kind">{show.kind}</span>
            <span className="ply-live"><i />{paused ? "en pausa" : "reproduciendo"}</span>
            <span className="ply-title">{show.title}</span>
            <span className="ply-bar"><b style={{ width: (position / show.length) * 100 + "%" }} /></span>
          </>
        ) : (
          <span className="ply-idle">Esperando el evento mfe:play<br />elige algo en el catálogo</span>
        )}
      </div>
      <div className="ply-ctrl">
        <span>{show ? `${clock(position)} / ${clock(show.length)}` : "--:-- / --:--"}</span>
        <span>{latency === null ? "sin eventos aún" : `recibido de "${show.from}" en ${latency} ms`}</span>
        <button disabled={!show} onClick={() => setPaused((value) => !value)}>{paused ? "Reanudar" : "Pausa"}</button>
      </div>
    </section>
  );
}
