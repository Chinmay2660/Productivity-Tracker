"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, getErrorMessage } from "@/lib/api";
import type { PrepInsights } from "@/lib/prep-insights";

export function usePrepInsights(enabled: boolean) {
  const [data, setData] = useState<PrepInsights | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      setData(await apiGet<PrepInsights>("/api/prep-insights"));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load insights"));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
