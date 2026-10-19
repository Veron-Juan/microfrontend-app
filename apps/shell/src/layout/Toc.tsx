import { LESSONS } from "../lessons/lessons.ts";

export function Toc() {
  return (
    <nav className="sticky top-[76px] self-start pt-14 max-[900px]:hidden" aria-label="Lecciones">
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
        Pulsa <kbd>I</kbd> en cualquier momento para ver qué app sirve cada parte.
      </p>
    </nav>
  );
}
