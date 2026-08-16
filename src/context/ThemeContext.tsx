"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Apply theme to DOM
  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    let effectiveDark = false;

    if (mode === "dark") {
      effectiveDark = true;
    } else if (mode === "light") {
      effectiveDark = false;
    } else if (mode === "system") {
      effectiveDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (effectiveDark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }

    setIsDark(effectiveDark);
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_theme_mode") as ThemeMode | null;
      const initialTheme: ThemeMode = saved === "dark" || saved === "light" || saved === "system" ? saved : "light";
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch {
      applyTheme("light");
    }
    setMounted(true);
  }, [applyTheme]);

  // Listen to system changes if in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("admin_theme_mode", newTheme);
    } catch {}
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = isDark ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
