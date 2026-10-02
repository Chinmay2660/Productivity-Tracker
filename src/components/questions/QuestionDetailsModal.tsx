"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/common/Button";
import Avatar from "@/components/common/Avatar";
import { TaskWithDetails } from "@/types/task";
import { ProgressStatus } from "@/types/progress";
import { StatusSelect } from "@/components/common/StatusBadge";
import { apiDelete, apiPatch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function QuestionDetailsModal({
  task,
  onClose,
  onChanged,
  onEdit,
}: {
  task: TaskWithDetails | null;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (task: TaskWithDetails) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [remarkDrafts, setRemarkDrafts] = useState<Record<string, string>>({});

  if (!task) return null;

  async function updateStatus(progressId: string, status: ProgressStatus) {
    try {
      await apiPatch(`/api/progress/${progressId}`, { status });
      toast.success("Progress updated");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update progress");
    }
  }

  async function saveRemark(progressId: string) {
    const remark = remarkDrafts[progressId];
    if (remark === undefined) return;
    try {
      await apiPatch(`/api/progress/${progressId}`, { remark });
      toast.success("Remark saved");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save remark");
    }
  }

  async function handleDelete() {
    try {
      await apiDelete(`/api/tasks/${task!._id}`);
      toast.success("Question deleted");
      setConfirmDelete(false);
      onClose();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete question");
    }
  }

  return (
    <>
      <Modal open={!!task} onClose={onClose} title="Question Details" widthClassName="max-w-xl">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 font-medium text-brand-blue">
              {task.category?.name || "Unknown"}
            </span>
            <span className="flex items-center gap-1">📅 {formatDate(task.date)}</span>
          </div>

          {task.content && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Question
              </p>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800">
                {task.content}
              </p>
            </div>
          )}

          {task.link && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Reference Link
              </p>
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue/10"
              >
                🔗 Open Link
              </a>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Progress
            </p>
            <div className="space-y-3">
              {task.progress.length === 0 && (
                <p className="text-sm text-slate-400">No one assigned yet.</p>
              )}
              {task.progress.map((entry) => (
                <div
                  key={entry._id}
                  className="rounded-xl border border-slate-200 p-3 transition-colors hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <Avatar name={entry.person?.name || "?"} size="sm" />
                      {entry.person?.name || "Unknown"}
                    </span>
                    <StatusSelect
                      value={entry.status as ProgressStatus}
                      onChange={(status) => updateStatus(entry._id, status)}
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={remarkDrafts[entry._id] ?? entry.remark ?? ""}
                      onChange={(e) =>
                        setRemarkDrafts((prev) => ({ ...prev, [entry._id]: e.target.value }))
                      }
                      placeholder="Add a remark..."
                      className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs focus:border-brand-blue focus:outline-none"
                    />
                    <Button variant="outline" size="sm" onClick={() => saveRemark(entry._id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => onEdit(task)}>
              Edit
            </Button>
            <Button variant="dangerOutline" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Question"
        message="This will permanently delete this question and all associated progress records. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
