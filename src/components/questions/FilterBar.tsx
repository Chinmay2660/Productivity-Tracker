"use client";

import { Category } from "@/types/category";
import { Person } from "@/types/person";
import { ProgressStatus } from "@/types/progress";
import { STATUS_ORDER, STATUS_META } from "@/lib/utils";

export type QuickFilter = "today" | "yesterday" | "week" | "month" | "all" | "custom";

export interface FiltersState {
  quickFilter: QuickFilter;
  customStart: string;
  customEnd: string;
  personId: string;
  categoryId: string;
  status: ProgressStatus | "";
  search: string;
}

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All" },
];

export default function FilterBar({
  filters,
  onChange,
  categories,
  people,
  showSearch = true,
}: {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
  categories: Category[];
  people: Person[];
  showSearch?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.key}
            onClick={() => onChange({ ...filters, quickFilter: qf.key })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.quickFilter === qf.key
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {qf.label}
          </button>
        ))}
        <button
          onClick={() => onChange({ ...filters, quickFilter: "custom" })}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            filters.quickFilter === "custom"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Custom Range
        </button>
      </div>

      {filters.quickFilter === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={filters.customStart}
            onChange={(e) => onChange({ ...filters, customStart: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            value={filters.customEnd}
            onChange={(e) => onChange({ ...filters, customEnd: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.personId}
          onChange={(e) => onChange({ ...filters, personId: e.target.value })}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">All People</option>
          {people.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={filters.categoryId}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">All Subjects</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ProgressStatus | "" })}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].emoji} {STATUS_META[s].label}
            </option>
          ))}
        </select>

        {showSearch && (
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search questions..."
            className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        )}
      </div>
    </div>
  );
}

export const DEFAULT_FILTERS: FiltersState = {
  quickFilter: "today",
  customStart: "",
  customEnd: "",
  personId: "",
  categoryId: "",
  status: "",
  search: "",
};
