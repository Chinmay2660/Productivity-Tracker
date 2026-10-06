"use client";

import { memo } from "react";
import clsx from "clsx";
import Checkbox from "@/components/ui/Checkbox";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { TASK_STATUS_META } from "@/lib/utils";
import type { PrepTask } from "@/types";

export type TaskWithNames = PrepTask & { subjectName?: string; topicName?: string };

type TaskRowProps = {
  task: TaskWithNames;
  updating?: boolean;
  deleting?: boolean;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
};

function TaskRow({ task, updating, deleting, onToggle, onDelete }: TaskRowProps) {
  const meta = TASK_STATUS_META[task.status];
  const completed = task.status === "completed";

  return (
    <div
      className={clsx(
        "group -mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-[var(--surface-muted)]",
        (updating || deleting) && "opacity-60"
      )}
    >
      <div className="relative mt-0.5 shrink-0">
        <Checkbox
          checked={completed}
          disabled={updating || deleting}
          onChange={() => onToggle(task._id)}
          aria-label={`Mark "${task.title}" ${completed ? "incomplete" : "complete"}`}
        />
        {updating && (
          <span
            className="pointer-events-none absolute -inset-1 animate-spin rounded-full border-2 border-brand border-t-transparent"
            aria-hidden
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={clsx(
              "text-sm font-medium text-[var(--foreground)]",
              completed && "line-through text-[var(--muted)]"
            )}
          >
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
          {task.questionId && <StatusBadge label="Question" variant="default" />}
          <StatusBadge label={meta.label} variant={completed ? "success" : "default"} />
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {task.estimatedMinutes} min
          {task.subjectName && ` · ${task.subjectName}`}
          {task.topicName && ` · ${task.topicName}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(task._id)}
        disabled={updating || deleting}
        className="shrink-0 rounded-md px-2 py-1 text-xs text-[var(--muted)] opacity-0 transition-opacity hover:bg-[var(--surface-muted)] hover:text-danger group-hover:opacity-100 disabled:cursor-wait disabled:opacity-50"
      >
        {deleting ? "…" : "Delete"}
      </button>
    </div>
  );
}

export default memo(TaskRow);
