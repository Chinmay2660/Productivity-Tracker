"use client";

import { Search } from "lucide-react";

export default function QuestionTableSearch({
  value,
  onChange,
  className = "",
  inputId = "question-table-search",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputId?: string;
}) {
  return (
    <div className={className}>
      <label className="sr-only" htmlFor={inputId}>Search questions</label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by title or track…"
          className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] dark:border-[var(--input-border)]"
        />
      </div>
    </div>
  );
}
