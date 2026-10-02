"use client";

import { Person } from "@/types/person";
import { TaskWithDetails } from "@/types/task";
import { formatDate } from "@/lib/utils";
import { StatusEmoji } from "@/components/common/StatusBadge";
import { ProgressStatus } from "@/types/progress";

function questionLabel(task: TaskWithDetails): string {
  if (task.content) {
    const firstLine = task.content.split("\n")[0];
    return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
  }
  if (task.link) return task.link;
  return "(no content)";
}

export default function QuestionsTable({
  tasks,
  people,
  onRowClick,
}: {
  tasks: TaskWithDetails[];
  people: Person[];
  onRowClick: (task: TaskWithDetails) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Question</th>
            {people.map((p) => (
              <th key={p._id} className="px-3 py-3 text-center">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr
              key={task._id}
              onClick={() => onRowClick(task)}
              className="cursor-pointer hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(task.date)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {task.category?.name || "Unknown"}
                </span>
              </td>
              <td className="max-w-xs px-4 py-3 text-slate-800">{questionLabel(task)}</td>
              {people.map((p) => {
                const entry = task.progress.find((pr) => pr.personId === p._id);
                return (
                  <td key={p._id} className="px-3 py-3 text-center text-lg">
                    {entry ? <StatusEmoji status={entry.status as ProgressStatus} /> : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
