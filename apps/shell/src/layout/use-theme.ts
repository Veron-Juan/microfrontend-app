import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "mfe-theme";

// index.html already picked the theme before painting (to avoid a flash); here we read it from <html>.
const initialTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** The theme lives on <html data-theme>, so the shell and every remote see the same one. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // No storage (private mode): the theme lasts as long as the tab.
    }
  }, [theme]);

  const toggle = () => setTheme((current) => (current === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
