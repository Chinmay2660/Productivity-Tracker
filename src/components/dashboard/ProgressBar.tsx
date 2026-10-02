export default function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = clamped >= 80 ? "#46AF6A" : clamped >= 40 ? "#F3BF39" : "#EB5953";

  return (
    <div className="flex flex-1 items-center gap-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-semibold text-slate-700">
        {clamped}%
      </span>
    </div>
  );
}
