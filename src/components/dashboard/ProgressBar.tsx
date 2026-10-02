export default function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = clamped >= 80 ? "bg-green-500" : clamped >= 40 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-600">
        {clamped}%
      </span>
    </div>
  );
}
