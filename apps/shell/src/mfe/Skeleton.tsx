const BAR = "h-3.5 rounded-md bg-linear-90 from-line-soft via-line to-line-soft bg-size-[200%_100%] animate-shimmer";

export function Skeleton({ label }: { label: string }) {
  return (
    <div className="grid gap-2.5 py-1.5" aria-busy="true" aria-label={`Cargando ${label}`}>
      <span className={`${BAR} w-2/5`} />
      <span className={BAR} />
      <span className={`${BAR} w-[70%]`} />
    </div>
  );
}
