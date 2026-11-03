"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import type { PrepInsights } from "@/lib/prep-insights";

export default function SmartPlanCard({ insights }: { insights: PrepInsights | null }) {
  if (!insights) return null;
  const { plan, daysLeft } = insights;

  return (
    <Card>
      <CardHeader
        title="Today's smart plan"
        subtitle={
          daysLeft !== null
            ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} to your interview · ${plan.totalMinutes} min planned`
            : `${plan.totalMinutes} min planned`
        }
      />
      <p className="mb-3 flex items-start gap-2 text-xs text-[var(--muted)]">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
        {plan.summary}
      </p>
      <ol className="space-y-2">
        {plan.items.map((item, i) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2.5 transition-colors hover:bg-[var(--chip-bg-hover)]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="block truncate text-xs text-[var(--muted)]">{item.reason}</span>
              </span>
              {item.minutes > 0 && (
                <span className="shrink-0 text-xs text-[var(--muted)]">{item.minutes} min</span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
