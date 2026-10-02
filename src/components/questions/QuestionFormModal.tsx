"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Avatar from "@/components/common/Avatar";
import { Category } from "@/types/category";
import { Person } from "@/types/person";
import { apiPost } from "@/lib/api";

interface QuestionRow {
  content: string;
  link: string;
}

interface SubjectGroup {
  categoryId: string;
  questions: QuestionRow[];
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function emptyGroup(defaultCategoryId: string): SubjectGroup {
  return { categoryId: defaultCategoryId, questions: [{ content: "", link: "" }] };
}

export default function QuestionFormModal({
  open,
  onClose,
  onSaved,
  categories,
  people,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  people: Person[];
}) {
  const [date, setDate] = useState(todayIso());
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(todayIso());
      setGroups([emptyGroup(categories[0]?._id || "")]);
      setAssignTo(people.map((p) => p._id));
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function updateGroup(index: number, next: Partial<SubjectGroup>) {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, ...next } : g)));
  }

  function updateQuestionRow(groupIndex: number, rowIndex: number, next: Partial<QuestionRow>) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              questions: g.questions.map((q, ri) => (ri === rowIndex ? { ...q, ...next } : q)),
            }
          : g
      )
    );
  }

  function addQuestionRow(groupIndex: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, questions: [...g.questions, { content: "", link: "" }] } : g
      )
    );
  }

  function removeQuestionRow(groupIndex: number, rowIndex: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, questions: g.questions.filter((_, ri) => ri !== rowIndex) } : g
      )
    );
  }

  function addSubjectGroup() {
    const usedIds = groups.map((g) => g.categoryId);
    const next = categories.find((c) => !usedIds.includes(c._id)) || categories[0];
    setGroups((prev) => [...prev, emptyGroup(next?._id || "")]);
  }

  function removeSubjectGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function togglePerson(personId: string) {
    setAssignTo((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!date) {
      setFormError("Date is required");
      return;
    }
    if (groups.length === 0) {
      setFormError("Add at least one subject");
      return;
    }

    const preparedGroups = groups
      .map((g) => ({
        categoryId: g.categoryId,
        questions: g.questions
          .map((q) => ({ content: q.content.trim(), link: q.link.trim() }))
          .filter((q) => q.content || q.link),
      }))
      .filter((g) => g.categoryId && g.questions.length > 0);

    if (preparedGroups.length === 0) {
      setFormError("Each question must have content or a reference link");
      return;
    }

    setSubmitting(true);
    try {
      for (const group of preparedGroups) {
        await apiPost("/api/tasks", {
          date,
          categoryId: group.categoryId,
          questions: group.questions,
          assignTo,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save questions");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Questions" widthClassName="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <div className="space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <select
                  value={group.categoryId}
                  onChange={(e) => updateGroup(groupIndex, { categoryId: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium focus:border-brand-blue focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubjectGroup(groupIndex)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove subject
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {group.questions.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <textarea
                        value={row.content}
                        onChange={(e) =>
                          updateQuestionRow(groupIndex, rowIndex, { content: e.target.value })
                        }
                        placeholder={`Question ${rowIndex + 1} — paste question or problem statement...`}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      />
                      <input
                        value={row.link}
                        onChange={(e) =>
                          updateQuestionRow(groupIndex, rowIndex, { link: e.target.value })
                        }
                        placeholder="Reference link (optional) — https://..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-brand-blue focus:outline-none"
                      />
                    </div>
                    {group.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestionRow(groupIndex, rowIndex)}
                        className="self-start rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        aria-label="Remove question"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addQuestionRow(groupIndex)}
                className="mt-2 text-xs font-medium text-brand-blue hover:underline"
              >
                + Add another question
              </button>
            </div>
          ))}
        </div>

        {categories.length > 0 && (
          <button
            type="button"
            onClick={addSubjectGroup}
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            + Add another subject
          </button>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Assign To</p>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => {
              const checked = assignTo.includes(person._id);
              return (
                <button
                  type="button"
                  key={person._id}
                  onClick={() => togglePerson(person._id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2 py-1 pr-3 text-sm font-medium transition-colors ${
                    checked
                      ? "border-brand-blue/30 bg-brand-blue/10 text-brand-blue"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Avatar name={person.name} size="sm" />
                  {person.name}
                </button>
              );
            })}
            {people.length === 0 && (
              <p className="text-sm text-slate-400">No active people. Add people first.</p>
            )}
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || categories.length === 0}>
            {submitting ? "Saving..." : "Save All"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
