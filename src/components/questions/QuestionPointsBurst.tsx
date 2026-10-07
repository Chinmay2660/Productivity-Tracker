"use client";

import clsx from "clsx";

export default function QuestionPointsBurst({ points }: { points: number }) {
  return (
    <span
      className={clsx(
        "question-points-burst absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold shadow-soft",
        points > 0
          ? "bg-brand text-white"
          : "bg-[var(--surface-muted)] text-[var(--muted)]"
      )}
      aria-live="polite"
    >
      +{points}
    </span>
  );
}
