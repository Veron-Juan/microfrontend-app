interface FilterChipsProps {
  options: readonly string[];
  selected: string;
  onSelect: (option: string) => void;
}

/** Filtros por tipo. aria-pressed marca el activo (y lo usa el estilo). */
export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <div role="group" aria-label="Filtrar por tipo" className="cat:flex cat:flex-wrap cat:gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === selected}
          onClick={() => onSelect(option)}
          className="cat:cursor-pointer cat:rounded-full cat:border cat:border-faint cat:bg-transparent cat:px-[9px] cat:py-1.5 cat:font-mono cat:text-[11px] cat:leading-none cat:tracking-[.06em] cat:text-muted cat:uppercase cat:aria-pressed:border-mid cat:aria-pressed:text-strong"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
