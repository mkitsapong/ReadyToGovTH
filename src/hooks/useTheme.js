import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "readytogov_theme";
const EVENT_NAME = "readytogov_theme_changed";

function getSystemTheme() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function getStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch (e) {
    console.warn("Could not read theme from localStorage", e);
  }
  return getSystemTheme();
}

function applyThemeToDom(theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme);

  // Apply on mount and state change
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  // Sync across tabs and custom events
  useEffect(() => {
    const handleSync = () => {
      const current = getStoredTheme();
      setTheme(current);
      applyThemeToDom(current);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(EVENT_NAME, handleSync);

    // Also listen to system changes if user hasn't explicitly set preference
    const mediaQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const handleSystemChange = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        applyThemeToDom(newTheme);
      }
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    }

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(EVENT_NAME, handleSync);
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemChange);
      }
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      } catch (e) {
        console.warn("Could not save theme to localStorage", e);
      }
      applyThemeToDom(nextTheme);
      return nextTheme;
    });
  }, []);

  const isDark = theme === "dark";

  return { theme, isDark, toggleTheme };
}
