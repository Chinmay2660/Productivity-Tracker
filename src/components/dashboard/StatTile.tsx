export default function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-soft">
      <div
        className="absolute -right-3 -top-3 h-14 w-14 rounded-full opacity-10"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="text-sm leading-none">{icon}</span>
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
