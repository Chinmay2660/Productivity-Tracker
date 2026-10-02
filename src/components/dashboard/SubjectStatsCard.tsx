import Card, { CardHeader } from "@/components/common/Card";

interface SubjectStat {
  categoryId: string;
  name: string;
  totalQuestions: number;
  NOT_STARTED: number;
  IN_PROGRESS: number;
  DONE: number;
  REVISED: number;
}

const STAT_ROWS: { key: keyof SubjectStat; label: string; dot: string }[] = [
  { key: "DONE", label: "Done", dot: "#46AF6A" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "#F3BF39" },
  { key: "REVISED", label: "Revised", dot: "#CB41A2" },
  { key: "NOT_STARTED", label: "Not Started", dot: "#EB5953" },
];

export default function SubjectStatsCard({ stats }: { stats: SubjectStat[] }) {
  return (
    <Card>
      <CardHeader title="Statistics by Subject" icon="📐" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
        {stats.map((s) => {
          const total = s.totalQuestions;
          const doneShare = total > 0 ? (s.DONE / total) * 100 : 0;
          return (
            <div
              key={s.categoryId}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                <span className="text-xs font-medium text-slate-400">{total} total</span>
              </div>
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#46AF6A] transition-all duration-500"
                  style={{ width: `${doneShare}%` }}
                />
              </div>
              <dl className="space-y-1 text-xs text-slate-600">
                {STAT_ROWS.map((row) => (
                  <div key={row.key} className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: row.dot }}
                      />
                      {row.label}
                    </dt>
                    <dd className="font-medium text-slate-700">{s[row.key] as number}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
