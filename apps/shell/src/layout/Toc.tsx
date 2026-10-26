import { cx } from "../lib/cx.ts";
import { LESSONS } from "../lessons/lessons.ts";
import { useScrolledPast } from "./use-scrolled-past.ts";

export function Toc() {
  // The hero has the whole width to itself: the index shows up once it's left behind. Hidden it
  // isn't focusable either (visibility), so the keyboard doesn't land on links you can't see.
  const pastHero = useScrolledPast("hero");
  return (
    <nav
      className={cx(
        "sticky top-[76px] self-start pt-14 transition-[opacity,translate,visibility] duration-500 ease-out-soft motion-reduce:transition-none max-[900px]:hidden",
        !pastHero && "invisible -translate-x-2 opacity-0",
      )}
      aria-label="Lessons"
    >
      <ol className="grid gap-0.5">
        {LESSONS.map(({ id, label }, index) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="flex gap-2.5 py-[5px] text-[13px] text-muted transition-colors duration-200 hover:text-strong"
            >
              <span className="pt-0.5 font-mono text-[11px] text-lo">{String(index + 1).padStart(2, "0")}</span>
              {label}
            </a>
          </li>
        ))}
      </ol>
      <p className="mt-[22px] text-xs/normal text-muted">
        Press <kbd>I</kbd> at any time to see which app serves each part.
      </p>
    </nav>
  );
}
