"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, getErrorMessage } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import type { Group } from "@/types";

export default function GroupShell({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const [group, setGroup] = useState<Pick<Group, "name" | "description"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Group>(`/api/groups/${groupId}`);
      setGroup({ name: data.name, description: data.description });
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load group"));
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!group) return <ErrorState message="Group not found" onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{group.name}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {group.description || "Interview preparation group"}
        </p>
      </div>

      {children}
    </div>
  );
}
