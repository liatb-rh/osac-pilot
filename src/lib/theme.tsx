import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";
const KEY = "osac.theme";
const DARK_CLASS = "pf-v6-theme-dark";

interface ThemeCtx {
  theme: ThemeMode;
  toggle: () => void;
  setTheme: (t: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function applyTheme(t: ThemeMode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (t === "dark") html.classList.add(DARK_CLASS);
  else html.classList.remove(DARK_CLASS);
  html.dataset.theme = t;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    let initial: ThemeMode = "light";
    try {
      const saved = localStorage.getItem(KEY) as ThemeMode | null;
      if (saved === "dark" || saved === "light") initial = saved;
      else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) initial = "dark";
    } catch {}
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    applyTheme(t);
    try { localStorage.setItem(KEY, t); } catch {}
  };

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be within ThemeProvider");
  return ctx;
}
