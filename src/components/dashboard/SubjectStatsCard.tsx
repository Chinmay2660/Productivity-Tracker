interface SubjectStat {
  categoryId: string;
  name: string;
  totalQuestions: number;
  NOT_STARTED: number;
  IN_PROGRESS: number;
  DONE: number;
  REVISED: number;
}

export default function SubjectStatsCard({ stats }: { stats: SubjectStat[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Statistics by Subject
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
        {stats.map((s) => {
          const total = s.totalQuestions;
          return (
            <div key={s.categoryId} className="rounded-lg border border-slate-100 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-800">{s.name}</p>
              <dl className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Total Questions</dt>
                  <dd className="font-medium">{total}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>🟢 Done</dt>
                  <dd className="font-medium">{s.DONE}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>🟡 In Progress</dt>
                  <dd className="font-medium">{s.IN_PROGRESS}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>🩷 Revised</dt>
                  <dd className="font-medium">{s.REVISED}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>🔴 Not Started</dt>
                  <dd className="font-medium">{s.NOT_STARTED}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
