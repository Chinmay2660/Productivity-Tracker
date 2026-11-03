"use client";

import clsx from "clsx";
import {
  QUESTION_STATUS_META,
  QUESTION_STATUS_ORDER,
  normalizeQuestionStatus,
} from "@/lib/utils";
import type { QuestionStatus } from "@/types";

export default function QuestionStatusSelect({
  value,
  onChange,
  className,
}: {
  value: QuestionStatus;
  onChange: (status: QuestionStatus) => void;
  className?: string;
}) {
  const status = normalizeQuestionStatus(value);
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as QuestionStatus)}
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        "question-status-select cursor-pointer rounded-full py-1 pl-2.5 pr-7 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40",
        `qs-${status}`,
        className
      )}
    >
      {QUESTION_STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {QUESTION_STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}
