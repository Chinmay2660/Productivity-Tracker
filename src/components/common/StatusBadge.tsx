"use client";

import clsx from "clsx";
import { ProgressStatus } from "@/types/progress";
import { STATUS_META, STATUS_ORDER } from "@/lib/utils";

export function StatusEmoji({ status }: { status: ProgressStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      title={meta.label}
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: meta.dot }}
    />
  );
}

export function StatusPill({ status }: { status: ProgressStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        meta.bg,
        meta.border,
        meta.text
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      {meta.label}
    </span>
  );
}

export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: ProgressStatus;
  onChange: (status: ProgressStatus) => void;
  disabled?: boolean;
}) {
  const meta = STATUS_META[value];
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ProgressStatus)}
      className={clsx(
        "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/40",
        meta.bg,
        meta.border,
        meta.text
      )}
    >
      {STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {STATUS_META[status].label}
        </option>
      ))}
    </select>
  );
}
