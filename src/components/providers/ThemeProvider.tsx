"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useUser } from "@/components/providers/UserProvider";
import type { ThemePreference } from "@/types";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  mounted: boolean;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  mounted: false,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem("growthhub-theme") ?? localStorage.getItem("switch-theme")) as ThemePreference | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      setResolvedTheme(resolved);
      root.classList.toggle("dark", resolved === "dark");
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, mounted]);

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
    localStorage.setItem("growthhub-theme", t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, mounted, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Syncs saved user preference into the theme context after login. */
export function ThemeSync() {
  const { user } = useUser();
  const { mounted, setTheme } = useTheme();

  useEffect(() => {
    if (!mounted || !user?.theme) return;
    setTheme(user.theme);
  }, [user?.theme, setTheme, mounted]);

  return null;
}
