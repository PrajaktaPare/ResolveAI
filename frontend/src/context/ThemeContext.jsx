/**
 * @file ThemeContext.jsx
 * @description React Context Provider managing application light/dark display themes.
 * Dynamically updates HTML color-scheme flags, syncing with browser local cache and OS system preferences.
 */

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { THEME_STORAGE_KEY } from "@/utils/constants";
import { logger } from "@/utils/logger";

const log = logger.child("theme");

// Initialize undefined React context for theme values
const ThemeContext = createContext(undefined);

/**
 * getSystemTheme
 * Inspects browser media match queries to determine if the operating system is set to dark mode.
 */
function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * getStoredPreference
 * Retrieves previously stored theme preferences from browser localStorage.
 */
function getStoredPreference() {
  if (typeof window === "undefined") return "system";
  return localStorage.getItem(THEME_STORAGE_KEY) || "system";
}

/**
 * ThemeProvider Component
 * Supplies dark/light mode states, set/toggle hooks, and theme transition handlers to UI components.
 */
export function ThemeProvider({ children }) {
  // Theme preference options: "light" | "dark" | "system"
  const [preference, setPreference] = useState(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Determine active theme based on user preference or falling back to OS system settings
  const resolvedTheme = preference === "system" ? systemTheme : preference;

  // Apply corresponding stylesheet classes to HTML element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
    log.debug("Applied theme:", resolvedTheme, `(preference: ${preference})`);
  }, [resolvedTheme, preference]);

  // Listen to OS-level preferences changes if theme selection is set to "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Update theme setting configuration
  const setTheme = useCallback((value) => {
    setPreference(value);
    localStorage.setItem(THEME_STORAGE_KEY, value);
  }, []);

  // Switch between light and dark display modes
  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = prev === "system" ? getSystemTheme() : prev;
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Memoize values to prevent redundant rendering cycles
  const value = useMemo(
    () => ({ theme: resolvedTheme, preference, setTheme, toggleTheme }),
    [resolvedTheme, preference, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Custom hook useTheme
 * Exposes active theme context states.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

