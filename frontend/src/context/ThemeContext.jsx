import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { THEME_STORAGE_KEY } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("theme");

const ThemeContext = createContext(undefined);

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredPreference() {
  if (typeof window === "undefined") return "system";
  return localStorage.getItem(THEME_STORAGE_KEY) || "system";
}

export function ThemeProvider({ children }) {
  // preference: "light" | "dark" | "system"
  const [preference, setPreference] = useState(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const resolvedTheme = preference === "system" ? systemTheme : preference;

  // Apply the theme class to <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
    log.debug("Applied theme:", resolvedTheme, `(preference: ${preference})`);
  }, [resolvedTheme, preference]);

  // Track OS preference changes when in "system" mode.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((value) => {
    setPreference(value);
    localStorage.setItem(THEME_STORAGE_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = prev === "system" ? getSystemTheme() : prev;
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme: resolvedTheme, preference, setTheme, toggleTheme }),
    [resolvedTheme, preference, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
