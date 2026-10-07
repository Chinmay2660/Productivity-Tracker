import clsx from "clsx";
import { getReadinessBarColor } from "@/lib/readiness";

export default function ProgressBar({
  value,
  className,
  showLabel = false,
  size = "md",
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={clsx("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className={clsx(
          "w-full overflow-hidden rounded-full bg-[var(--surface-muted)]",
          heights[size]
        )}
      >
        <div
          className={clsx("h-full rounded-full transition-all duration-500", getReadinessBarColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function ReadinessRing({ value, size = 120 }: { value: number; size?: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-[var(--surface-muted)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={clsx(
            clamped >= 80 ? "text-emerald-500" :
            clamped >= 60 ? "text-amber-500" :
            clamped >= 40 ? "text-orange-500" : "text-red-500"
          )}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-[var(--foreground)]">{clamped}%</div>
      </div>
    </div>
  );
}
