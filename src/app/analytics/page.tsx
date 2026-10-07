"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/components/providers/UserProvider";
import { apiGet } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import type { AnalyticsData } from "@/types";

const AnalyticsCharts = dynamic(
  () => import("@/components/analytics/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-muted)]" />,
  }
);

export default function AnalyticsPage() {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const d = await apiGet<AnalyticsData>("/api/analytics");
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Preparation statistics and performance trends.</p>
      </div>

      <AnalyticsCharts data={data} />
    </div>
  );
}
