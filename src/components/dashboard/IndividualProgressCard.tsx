import { Category } from "@/types/category";
import { Person } from "@/types/person";
import { TaskWithDetails } from "@/types/task";
import Card, { CardHeader } from "@/components/common/Card";
import Avatar from "@/components/common/Avatar";

interface OverallRow {
  personId: string;
  name: string;
  NOT_STARTED: number;
  IN_PROGRESS: number;
  DONE: number;
  REVISED: number;
}

const OVERALL_ROWS: { key: keyof OverallRow; label: string; dot: string }[] = [
  { key: "DONE", label: "Completed", dot: "#46AF6A" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "#F3BF39" },
  { key: "REVISED", label: "Revised", dot: "#CB41A2" },
  { key: "NOT_STARTED", label: "Remaining", dot: "#EB5953" },
];

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
    <Card>
      <CardHeader title="Individual Progress" icon="🧑‍💻" />
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
            <div
              key={person._id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <Avatar name={person.name} size="sm" />
                <p className="text-sm font-semibold text-slate-800">{person.name}</p>
              </div>

              {byCategory.length > 0 && (
                <div className="mb-3 space-y-1 border-b border-slate-200/70 pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Selected Range
                  </p>
                  {byCategory.map((row) => (
                    <div key={row.name} className="flex justify-between text-xs text-slate-600">
                      <span>{row.name}</span>
                      <span className="font-medium text-slate-800">
                        {row.done} / {row.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Overall
                </p>
                {OVERALL_ROWS.map((row) => (
                  <div key={row.key} className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: row.dot }}
                      />
                      {row.label}
                    </span>
                    <span className="font-medium text-slate-800">
                      {(overall?.[row.key] as number) ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {people.length === 0 && <p className="text-sm text-slate-400">No active people yet.</p>}
      </div>
    </Card>
  );
}
