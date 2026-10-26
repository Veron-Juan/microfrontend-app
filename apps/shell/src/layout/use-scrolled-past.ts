import { useEffect, useState } from "react";

/**
 * True once the element with this `id` has scrolled up out of the screen's lower two thirds: what's
 * left of it on screen is a strip at the top that no longer holds the eye.
 */
export function useScrolledPast(id: string) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const element = document.getElementById(id);
    if (!element) return undefined;
    // The root is the screen minus its top third. The element stops crossing it when its bottom edge
    // goes above that line; it only counts as past if it left upwards, not if it's still below.
    const observer = new IntersectionObserver(
      ([entry]) => setPast(!!entry && !entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: "-33% 0px 0px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);

  return past;
}
