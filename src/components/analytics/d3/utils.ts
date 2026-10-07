import "d3-transition";
import { useEffect, useRef, useState } from "react";

export type ChartTheme = {
  foreground: string;
  muted: string;
  border: string;
  card: string;
  grid: string;
};

export function getChartTheme(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  return {
    foreground: style.getPropertyValue("--foreground").trim() || "#1c1917",
    muted: style.getPropertyValue("--muted").trim() || "#78716c",
    border: style.getPropertyValue("--border").trim() || "rgba(28, 25, 23, 0.1)",
    card: style.getPropertyValue("--card").trim() || "#ffffff",
    grid: style.getPropertyValue("--border").trim() || "rgba(28, 25, 23, 0.1)",
  };
}

export function useChartSize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize({ width: Math.max(width, 0), height: Math.max(height, 0) });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
}

export function formatTooltip(
  container: HTMLDivElement,
  content: string,
  x: number,
  y: number
) {
  container.innerHTML = content;
  container.style.opacity = "1";
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
}

export function hideTooltip(container: HTMLDivElement) {
  container.style.opacity = "0";
}
