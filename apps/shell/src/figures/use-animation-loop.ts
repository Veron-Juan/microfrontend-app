import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export type Tick = (dt: number, stage: HTMLDivElement, readout: HTMLSpanElement) => void;

const MAX_STEP = 1 / 20;

/**
 * Corre `tick` en cada frame, solo mientras la figura está en pantalla.
 * Las figuras se animan tocando el SVG directamente: pasar por React a 60 fps no aporta nada.
 */
export function useAnimationLoop(
  stageRef: RefObject<HTMLDivElement>,
  readoutRef: RefObject<HTMLSpanElement>,
  tick: Tick,
) {
  const tickRef = useRef(tick);
  useLayoutEffect(() => {
    tickRef.current = tick;
  });

  useEffect(() => {
    const stage = stageRef.current;
    const readout = readoutRef.current;
    if (!stage || !readout) return undefined;
    let frame = 0;
    let last = 0;
    let visible = false;
    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, MAX_STEP) : 1 / 60;
      last = now;
      tickRef.current(dt, stage, readout);
      frame = visible ? requestAnimationFrame(step) : 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible && !frame) {
        last = 0;
        frame = requestAnimationFrame(step);
      }
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [stageRef, readoutRef]);
}
