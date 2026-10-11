"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useUser } from "@/components/providers/UserProvider";
import { apiGet, apiPost, apiPatch, apiDelete, getErrorMessage } from "@/lib/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TablePagination from "@/components/ui/TablePagination";
import MotivationBanner from "@/components/dashboard/MotivationBanner";
import TaskRow, { type TaskWithNames } from "@/components/tasks/TaskRow";
import { ErrorState, EmptyState, TasksPageSkeleton } from "@/components/ui/StateViews";
import { TABLE_PAGE_SIZE } from "@/lib/utils";
import toast from "react-hot-toast";

type PagedTasks = {
  items: TaskWithNames[];
  total: number;
  page: number;
  limit: number;
  activeTotal: number;
  completedTotal: number;
};

export default function TasksPage() {
  const { user } = useUser();
  const [pendingTasks, setPendingTasks] = useState<TaskWithNames[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskWithNames[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(() => new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());

  const activeGroupId = user?.activeGroupId;

  const loadTasks = useCallback(async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const [active, completed] = await Promise.all([
        apiGet<PagedTasks>(
          `/api/tasks?groupId=${activeGroupId}&bucket=active&page=${pendingPage}&limit=${TABLE_PAGE_SIZE}`
        ),
        apiGet<PagedTasks>(
          `/api/tasks?groupId=${activeGroupId}&bucket=completed&page=${completedPage}&limit=${TABLE_PAGE_SIZE}`
        ),
      ]);
      setPendingTasks(active.items);
      setPendingTotal(active.activeTotal);
      setCompletedTasks(completed.items);
      setCompletedTotal(completed.completedTotal);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [activeGroupId, pendingPage, completedPage]);

  useEffect(() => {
    if (!activeGroupId) {
      setLoading(false);
      return;
    }
    loadTasks();
  }, [activeGroupId, loadTasks]);

  const setUpdating = useCallback((id: string, active: boolean) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const setDeleting = useCallback((id: string, active: boolean) => {
    setDeletingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const createTask = async () => {
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    try {
      await apiPost<TaskWithNames>("/api/tasks", {
        groupId: user.activeGroupId,
        title: newTitle,
        priority: newPriority,
      });
      toast.success("Task created");
      setShowModal(false);
      setNewTitle("");
      if (pendingPage !== 1) setPendingPage(1);
      else await loadTasks();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create task"));
    } finally {
      setCreating(false);
    }
  };

  const toggleTask = useCallback(
    async (taskId: string) => {
      if (updatingIds.has(taskId) || deletingIds.has(taskId)) return;

      const task =
        pendingTasks.find((t) => t._id === taskId) ??
        completedTasks.find((t) => t._id === taskId);
      if (!task) return;

      const previousStatus = task.status;
      const nextStatus = previousStatus === "completed" ? "pending" : "completed";

      setUpdating(taskId, true);
      try {
        await apiPatch(`/api/tasks/${taskId}`, { status: nextStatus });
        await loadTasks();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update task"));
      } finally {
        setUpdating(taskId, false);
      }
    },
    [updatingIds, deletingIds, pendingTasks, completedTasks, loadTasks, setUpdating]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (updatingIds.has(taskId) || deletingIds.has(taskId)) return;

      setDeleting(taskId, true);
      try {
        await apiDelete(`/api/tasks/${taskId}`);
        toast.success("Task deleted");
        await loadTasks();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to delete task"));
      } finally {
        setDeleting(taskId, false);
      }
    },
    [updatingIds, deletingIds, loadTasks, setDeleting]
  );

  const totalTasks = pendingTotal + completedTotal;

  if (loading && totalTasks === 0 && pendingTasks.length === 0 && completedTasks.length === 0) {
    return <TasksPageSkeleton />;
  }

  if (error && totalTasks === 0) {
    return <ErrorState message={error} onRetry={() => loadTasks()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {`${pendingTotal} pending · ${completedTotal} completed`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          Add Task
        </Button>
      </div>

      <MotivationBanner />

      {totalTasks === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Add tasks to track what needs to be done."
          action={<Button onClick={() => setShowModal(true)}>Add Task</Button>}
        />
      ) : (
        <div className="space-y-4">
          {pendingTotal > 0 && (
            <TaskSection
              title="To Do"
              tasks={pendingTasks}
              total={pendingTotal}
              page={pendingPage}
              loading={loading}
              onPageChange={setPendingPage}
              updatingIds={updatingIds}
              deletingIds={deletingIds}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          )}
          {completedTotal > 0 && (
            <TaskSection
              title="Completed"
              tasks={completedTasks}
              total={completedTotal}
              page={completedPage}
              loading={loading}
              onPageChange={setCompletedPage}
              updatingIds={updatingIds}
              deletingIds={deletingIds}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Task">
        <div className="space-y-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded-lg border border-[var(--input-border)] px-4 py-2.5 text-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)]"
            autoFocus
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as typeof newPriority)}
            className="w-full rounded-lg border border-[var(--input-border)] px-4 py-2.5 text-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)]"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Button onClick={createTask} className="w-full" disabled={creating}>
            {creating ? "Creating…" : "Create Task"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const TaskSection = memo(function TaskSection({
  title,
  tasks,
  total,
  page,
  loading,
  onPageChange,
  updatingIds,
  deletingIds,
  onToggle,
  onDelete,
}: {
  title: string;
  tasks: TaskWithNames[];
  total: number;
  page: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  updatingIds: Set<string>;
  deletingIds: Set<string>;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">{title}</h2>
      <div
        className={loading ? "divide-y divide-[color-mix(in_srgb,var(--border)_60%,transparent)] opacity-60" : "divide-y divide-[color-mix(in_srgb,var(--border)_60%,transparent)]"}
      >
        {tasks.map((t) => (
          <TaskRow
            key={t._id}
            task={t}
            updating={updatingIds.has(t._id)}
            deleting={deletingIds.has(t._id)}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
      <div className="mt-3">
        <TablePagination page={page} total={total} loading={loading} onPageChange={onPageChange} />
      </div>
    </div>
  );
});
