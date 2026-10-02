"use client";

import { Person } from "@/types/person";
import { TaskWithDetails } from "@/types/task";
import { formatDate } from "@/lib/utils";
import { StatusEmoji } from "@/components/common/StatusBadge";
import { ProgressStatus } from "@/types/progress";
import Avatar from "@/components/common/Avatar";

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
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Subject</th>
              <th className="px-4 py-3 font-semibold">Question</th>
              {people.map((p) => (
                <th key={p._id} className="px-3 py-3 text-center font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <Avatar name={p.name} size="sm" />
                    <span className="normal-case text-[11px] text-slate-400">{p.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr
                key={task._id}
                onClick={() => onRowClick(task)}
                className="cursor-pointer transition-colors hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                  {formatDate(task.date)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-medium text-brand-blue">
                    {task.category?.name || "Unknown"}
                  </span>
                </td>
                <td className="max-w-xs px-4 py-3.5 text-slate-800">{questionLabel(task)}</td>
                {people.map((p) => {
                  const entry = task.progress.find((pr) => pr.personId === p._id);
                  return (
                    <td key={p._id} className="px-3 py-3.5 text-center">
                      {entry ? (
                        <div className="flex justify-center">
                          <StatusEmoji status={entry.status as ProgressStatus} />
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
