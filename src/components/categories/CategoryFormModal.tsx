"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import { Category } from "@/types/category";

export default function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  category,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  category?: Category | null;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name || "");
    }
  }, [open, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? "Edit Subject" : "Add Subject"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HTML"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
