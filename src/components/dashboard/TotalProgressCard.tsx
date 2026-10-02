import Card, { CardHeader } from "@/components/common/Card";

interface CategoryTotal {
  categoryId: string;
  name: string;
  total: number;
}

const BAR_COLORS = ["#25A6EE", "#A361CF", "#13C8A5", "#CB41A2", "#F59D02", "#4883CF"];

export default function TotalProgressCard({ totals }: { totals: CategoryTotal[] }) {
  const max = Math.max(1, ...totals.map((t) => t.total));

  return (
    <Card>
      <CardHeader title="Total Progress" icon="📦" />
      <div className="space-y-3.5">
        {totals.length === 0 && <p className="text-sm text-slate-400">No subjects yet.</p>}
        {totals.map((t, i) => (
          <div key={t.categoryId} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm font-medium text-slate-700">
              {t.name}
            </span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(t.total / max) * 100}%`,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold text-slate-700">
              {t.total}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
