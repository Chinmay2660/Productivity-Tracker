"use client";

import clsx from "clsx";
import { ProgressStatus } from "@/types/progress";
import { STATUS_META, STATUS_ORDER } from "@/lib/utils";

export function StatusEmoji({ status }: { status: ProgressStatus }) {
  return <span title={STATUS_META[status].label}>{STATUS_META[status].emoji}</span>;
}

export function StatusPill({ status }: { status: ProgressStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.bg,
        meta.text
      )}
    >
      {meta.emoji} {meta.label}
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
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ProgressStatus)}
      className={clsx(
        "cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400",
        STATUS_META[value].bg,
        STATUS_META[value].text
      )}
    >
      {STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {STATUS_META[status].emoji} {STATUS_META[status].label}
        </option>
      ))}
    </select>
  );
}
