"use client";

import { getReadinessLabel } from "@/lib/readiness";
import Card from "@/components/ui/Card";
import ProgressBar, { ReadinessRing } from "@/components/ui/ProgressBar";

export function ReadinessCard({ readiness }: { readiness: number }) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <ReadinessRing value={readiness} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Interview Readiness</p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {getReadinessLabel(readiness)}
          </p>
          <ProgressBar value={readiness} className="mt-3" showLabel />
        </div>
      </div>
    </Card>
  );
}
