import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "mfe-theme";

// index.html ya eligió el tema antes de pintar (para no parpadear); aquí lo leemos de <html>.
const initialTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** El tema vive en <html data-theme>, para que el shell y todos los remotes lo vean igual. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Sin almacenamiento (modo privado): el tema dura lo que dura la pestaña.
    }
  }, [theme]);

  const toggle = () => setTheme((current) => (current === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
