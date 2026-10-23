/** Joins conditional classes: cx("a", ok && "b", undefined) → "a b". */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
