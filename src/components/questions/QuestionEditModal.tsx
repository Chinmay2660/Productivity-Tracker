"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/common/Modal";
import { Category } from "@/types/category";
import { Person } from "@/types/person";
import { TaskWithDetails } from "@/types/task";
import { apiPatch } from "@/lib/api";
import { toDateOnlyString } from "@/lib/utils";

export default function QuestionEditModal({
  task,
  onClose,
  onSaved,
  categories,
  people,
}: {
  task: TaskWithDetails | null;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  people: Person[];
}) {
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setDate(toDateOnlyString(task.date));
      setCategoryId(task.categoryId);
      setContent(task.content || "");
      setLink(task.link || "");
      setAssignTo(task.progress.map((p) => p.personId));
      setFormError(null);
    }
  }, [task]);

  if (!task) return null;

  function togglePerson(personId: string) {
    setAssignTo((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !link.trim()) {
      setFormError("Provide a question/content or a reference link");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiPatch(`/api/tasks/${task!._id}`, {
        date,
        categoryId,
        content,
        link,
        assignTo,
      });
      toast.success("Question updated");
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update question");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!task} onClose={onClose} title="Edit Question" widthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Question / Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Reference Link (optional)
          </label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Assign To</p>
          <div className="flex flex-wrap gap-3">
            {people.map((person) => (
              <label key={person._id} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={assignTo.includes(person._id)}
                  onChange={() => togglePerson(person._id)}
                  className="rounded border-slate-300"
                />
                {person.name}
              </label>
            ))}
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
