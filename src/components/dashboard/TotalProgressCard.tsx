interface CategoryTotal {
  categoryId: string;
  name: string;
  total: number;
}

export default function TotalProgressCard({ totals }: { totals: CategoryTotal[] }) {
  const max = Math.max(1, ...totals.map((t) => t.total));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Total Progress
      </h2>
      <div className="space-y-3">
        {totals.length === 0 && <p className="text-sm text-slate-400">No subjects yet.</p>}
        {totals.map((t) => (
          <div key={t.categoryId} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm font-medium text-slate-800">
              {t.name}
            </span>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-700"
                style={{ width: `${(t.total / max) * 100}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-600">
              {t.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
