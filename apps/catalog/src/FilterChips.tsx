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
          className="cat:h-7 cat:cursor-pointer cat:rounded-full cat:border cat:border-faint cat:bg-transparent cat:px-3 cat:font-sans cat:text-[12px] cat:leading-none cat:text-text cat:transition-colors cat:hover:border-mid cat:hover:text-strong cat:aria-pressed:border-strong cat:aria-pressed:bg-strong cat:aria-pressed:text-card"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
