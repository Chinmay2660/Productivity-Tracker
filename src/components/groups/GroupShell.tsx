"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiGet, getErrorMessage } from "@/lib/api";
import { GroupShellSkeleton, ErrorState } from "@/components/ui/StateViews";
import type { Group } from "@/types";

type GroupHeaderActionsContextValue = {
  setHeaderActions: (actions: ReactNode) => void;
};

const GroupHeaderActionsContext = createContext<GroupHeaderActionsContextValue | null>(null);

/** Pin actions (e.g. Edit Group) into the group title row from a child page. */
export function useGroupHeaderActions() {
  const ctx = useContext(GroupHeaderActionsContext);
  return ctx?.setHeaderActions ?? null;
}

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
  const [headerActions, setHeaderActionsState] = useState<ReactNode>(null);

  const setHeaderActions = useCallback((actions: ReactNode) => {
    setHeaderActionsState(actions);
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Pick<Group, "name" | "description">>(
        `/api/groups/${groupId}?view=header`
      );
      setGroup({ name: data.name, description: data.description });
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load group"));
      if (!silent) setGroup(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !group) return <GroupShellSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!group) return <ErrorState message="Group not found" onRetry={load} />;

  return (
    <GroupHeaderActionsContext.Provider value={{ setHeaderActions }}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{group.name}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {group.description || "Interview preparation group"}
            </p>
          </div>
          {headerActions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{headerActions}</div>
          ) : null}
        </div>

        {children}
      </div>
    </GroupHeaderActionsContext.Provider>
  );
}
