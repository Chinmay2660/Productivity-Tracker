import { Category } from "@/types/category";
import { Person } from "@/types/person";
import { TaskWithDetails } from "@/types/task";

interface OverallRow {
  personId: string;
  name: string;
  NOT_STARTED: number;
  IN_PROGRESS: number;
  DONE: number;
  REVISED: number;
}

export default function IndividualProgressCard({
  people,
  categories,
  rangeTasks,
  overallByPerson,
}: {
  people: Person[];
  categories: Category[];
  rangeTasks: TaskWithDetails[];
  overallByPerson: OverallRow[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Individual Progress
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {people.map((person) => {
          const byCategory = categories
            .map((category) => {
              const tasksForCategory = rangeTasks.filter((t) => t.categoryId === category._id);
              const assigned = tasksForCategory.filter((t) =>
                t.progress.some((p) => p.personId === person._id)
              );
              const done = assigned.filter((t) =>
                t.progress.some(
                  (p) =>
                    p.personId === person._id && (p.status === "DONE" || p.status === "REVISED")
                )
              );
              return { name: category.name, done: done.length, total: assigned.length };
            })
            .filter((row) => row.total > 0);

          const overall = overallByPerson.find((o) => o.personId === person._id);

          return (
            <div key={person._id} className="rounded-lg border border-slate-100 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-800">{person.name}</p>

              {byCategory.length > 0 && (
                <div className="mb-3 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Selected Range
                  </p>
                  {byCategory.map((row) => (
                    <div key={row.name} className="flex justify-between text-xs text-slate-600">
                      <span>{row.name}</span>
                      <span className="font-medium">
                        {row.done} / {row.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Overall</p>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>🟢 Completed</span>
                  <span className="font-medium">{overall?.DONE ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>🟡 In Progress</span>
                  <span className="font-medium">{overall?.IN_PROGRESS ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>🩷 Revised</span>
                  <span className="font-medium">{overall?.REVISED ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>🔴 Remaining</span>
                  <span className="font-medium">{overall?.NOT_STARTED ?? 0}</span>
                </div>
              </div>
            </div>
          );
        })}
        {people.length === 0 && <p className="text-sm text-slate-400">No active people yet.</p>}
      </div>
    </div>
  );
}
