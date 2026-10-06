"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

const buttonClass =
  "inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]";

export default function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { resolvedTheme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button type="button" aria-label="Toggle theme" className={clsx(buttonClass, className)}>
        <Moon className="h-4 w-4" strokeWidth={2} aria-hidden />
        {showLabel && <span>Theme</span>}
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={clsx(buttonClass, className)}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2} />
      )}
      {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
