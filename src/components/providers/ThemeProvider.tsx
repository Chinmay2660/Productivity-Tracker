"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, ReactNode } from "react";
import { useUser } from "@/components/providers/UserProvider";
import type { ThemePreference } from "@/types";

const STORAGE_KEY = "growthhub-theme";
const LEGACY_KEY = "switch-theme";

function getStoredTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return null;
}

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyThemeToDom(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

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

  const apply = useCallback((t: ThemePreference) => {
    const resolved = resolveTheme(t);
    setResolvedTheme(resolved);
    applyThemeToDom(resolved);
  }, []);

  useLayoutEffect(() => {
    const stored = getStoredTheme() ?? "system";
    setThemeState(stored);
    apply(stored);
    setMounted(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if ((getStoredTheme() ?? "system") === "system") apply("system");
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [apply]);

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    apply(t);
  }, [apply]);

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
    // Device preference wins until the user has no local choice (e.g. first visit).
    if (!getStoredTheme()) setTheme(user.theme);
  }, [user?.theme, setTheme, mounted]);

  return null;
}
