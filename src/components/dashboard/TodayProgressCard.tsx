"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ProgressBar from "./ProgressBar";
import { getMotivationalRemark } from "@/lib/utils";
import Card, { CardHeader } from "@/components/common/Card";
import Avatar from "@/components/common/Avatar";

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
    <Card>
      <CardHeader title="Today's Progress" icon="🎯" />
      <div className="space-y-4">
        {rows.length === 0 && <p className="text-sm text-slate-400">No active people yet.</p>}
        {rows.map((row) => {
          const remark = customRemarks[row.personId] ?? getMotivationalRemark(row.percent, false);
          return (
            <div key={row.personId} className="space-y-1.5">
              <div className="flex items-center gap-3">
                <Avatar name={row.name} size="sm" />
                <span className="w-20 shrink-0 truncate text-sm font-medium text-slate-800">
                  {row.name}
                </span>
                <ProgressBar percent={row.percent} />
              </div>
              {editingId === row.personId ? (
                <div className="flex gap-2 pl-11">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-brand-blue focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => saveRemark(row.personId)}
                    className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(row.personId, remark)}
                  className="pl-11 text-left text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                  {remark}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
