import { useEffect, useState } from "react";
import { on, type PlayDetail, type RemoteMeta } from "@mfe/contracts";
import styles from "./player.css?inline";
import { Controls } from "./Controls.tsx";
import { Screen } from "./Screen.tsx";
import { advance } from "./format.ts";

export const meta: RemoteMeta = { name: "player", version: "2.1.3", team: "Equipo Reproducción", render: "CSR" };

export default function Player() {
  const [show, setShow] = useState<PlayDetail | null>(null);
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  // El reproductor solo conoce el contrato del evento, no al emisor.
  useEffect(() => {
    return on("mfe:play", (detail) => {
      setShow(detail);
      setPosition(0);
      setPaused(false);
      setLatency(Date.now() - detail.at);
    });
  }, []);

  useEffect(() => {
    if (!show || paused) return undefined;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setPosition((value) => advance(value, now - last, show.length));
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [show, paused]);

  return (
    <section className="ply:grid ply:gap-3 ply:font-sans">
      {/* El CSS compilado viaja dentro del módulo remoto: funciona igual en el shell y en standalone. */}
      <style>{styles}</style>
      <Screen show={show} position={position} paused={paused} />
      <Controls
        show={show}
        position={position}
        latency={latency}
        paused={paused}
        onTogglePause={() => setPaused((value) => !value)}
      />
    </section>
  );
}
