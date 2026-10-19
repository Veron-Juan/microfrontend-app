import type { ReactNode } from "react";
import { lessonNumber, type LessonId } from "../lessons/lessons.ts";

interface LessonProps {
  id: LessonId;
  title: string;
  kicker?: string;
  children: ReactNode;
}

/** Una sección numerada de la lección. El número sale del índice, así que nunca se desordena. */
export function Lesson({ id, title, kicker, children }: LessonProps) {
  return (
    <section className="mt-10 border-t border-line-soft pt-16 pb-2" id={id} aria-labelledby={`${id}-title`}>
      <header className="mb-[22px] grid grid-cols-[auto_1fr] items-baseline gap-x-[18px] max-[560px]:grid-cols-1">
        <span className="rounded-full border border-line px-[9px] py-0.5 font-mono text-[13px] font-medium text-muted max-[560px]:mb-2.5 max-[560px]:justify-self-start">
          {String(lessonNumber(id)).padStart(2, "0")}
        </span>
        <h2
          id={`${id}-title`}
          className="font-serif text-[clamp(30px,4vw,42px)]/[1.05] font-medium tracking-[-.015em] text-strong"
        >
          {title}
        </h2>
        {kicker && (
          <p className="col-start-2 mt-2 font-serif text-[19px]/[1.4] text-muted italic max-[560px]:col-start-1">
            {kicker}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

/** Texto corrido con ancho de lectura cómodo. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-[680px] [&>p]:mb-4 [&>p]:text-base">{children}</div>;
}

/** Lista de reglas o puntos clave. */
export function Rules({ children }: { children: ReactNode }) {
  return <ul className="mb-4 list-disc pl-[18px] text-sm [&>li]:my-1">{children}</ul>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-muted">{children}</p>;
}
