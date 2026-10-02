"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ProgressBar from "./ProgressBar";
import { getMotivationalRemark } from "@/lib/utils";

interface PersonProgressRow {
  personId: string;
  name: string;
  total: number;
  completed: number;
  percent: number;
}

export default function TodayProgressCard({ rows }: { rows: PersonProgressRow[] }) {
  const [customRemarks, setCustomRemarks] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(personId: string, current: string) {
    setEditingId(personId);
    setDraft(current);
  }

  function saveRemark(personId: string) {
    setCustomRemarks((prev) => ({ ...prev, [personId]: draft }));
    setEditingId(null);
    toast.success("Remark saved");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Today&apos;s Progress
      </h2>
      <div className="space-y-4">
        {rows.length === 0 && <p className="text-sm text-slate-400">No active people yet.</p>}
        {rows.map((row) => {
          const remark = customRemarks[row.personId] ?? getMotivationalRemark(row.percent, false);
          return (
            <div key={row.personId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="w-28 shrink-0 truncate text-sm font-medium text-slate-800">
                  {row.name}
                </span>
                <ProgressBar percent={row.percent} />
              </div>
              {editingId === row.personId ? (
                <div className="flex gap-2 pl-0 sm:pl-32">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    autoFocus
                  />
                  <button
                    onClick={() => saveRemark(row.personId)}
                    className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(row.personId, remark)}
                  className="pl-0 text-left text-xs text-slate-500 hover:underline sm:pl-32"
                >
                  {remark}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
