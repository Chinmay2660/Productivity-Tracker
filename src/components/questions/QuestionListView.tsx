"use client";

import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/components/ui/Button";
import ExpandableQuestionContent from "@/components/questions/ExpandableQuestionContent";
import QuestionPointsBurst from "@/components/questions/QuestionPointsBurst";
import QuestionScopeChip from "@/components/questions/QuestionScopeChip";
import QuestionStatusSelect from "@/components/questions/QuestionStatusSelect";
import type { QuestionPointBurst } from "@/lib/question-points-burst";
import {
  formatDate,
  questionRowVars,
  type QuestionSortDir,
  type QuestionSortField,
} from "@/lib/utils";
import type { ContentScope, QuestionStatus } from "@/types";

export type QuestionListItem = {
  _id: string;
  content: string;
  status: QuestionStatus;
  practiceDate?: string;
  createdAt?: string;
  trackLabel?: string;
  subjectName?: string;
  link?: string;
  scope?: ContentScope;
};

function SortableHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: QuestionSortField;
  sortBy?: QuestionSortField;
  sortDir?: QuestionSortDir;
  onSort?: (field: QuestionSortField) => void;
  className?: string;
}) {
  if (!onSort) {
    return <th className={className}>{label}</th>;
  }
  const active = sortBy === field;
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={clsx(
          "inline-flex items-center gap-1 font-semibold uppercase tracking-wide transition-colors",
          active ? "text-[var(--foreground)]" : "hover:text-[var(--foreground)]"
        )}
      >
        {label}
        {active &&
          (sortDir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          ))}
      </button>
    </th>
  );
}

export default function QuestionListView({
  questions,
  onStatusChange,
  onEdit,
  onDelete,
  showScope = false,
  showActions = false,
  sortBy,
  sortDir,
  onSort,
  loading = false,
  pointBurst = null,
}: {
  questions: QuestionListItem[];
  onStatusChange: (id: string, status: QuestionStatus) => void;
  pointBurst?: QuestionPointBurst | null;
  onEdit?: (question: QuestionListItem) => void;
  onDelete?: (id: string) => void;
  showScope?: boolean;
  showActions?: boolean;
  sortBy?: QuestionSortField;
  sortDir?: QuestionSortDir;
  onSort?: (field: QuestionSortField) => void;
  loading?: boolean;
}) {
  const scopeCol = showScope ? "w-[10%]" : "";
  const questionCol = showScope ? "w-[30%]" : "w-[34%]";
  const trackCol = showScope ? "w-[14%]" : "w-[18%]";
  const actionsCol = showActions ? "w-[12%]" : "";

  return (
    <>
      <div className={clsx("space-y-3 lg:hidden", loading && "opacity-60")}>
        {questions.map((q) => (
          <div
            key={q._id}
            style={questionRowVars(q.status)}
            className={clsx(
              "question-row-card rounded-2xl border border-[var(--border)] p-4",
              pointBurst?.id === q._id && "question-row-points-flash"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <ExpandableQuestionContent content={q.content} className="min-w-0 flex-1" />
              <div className="relative shrink-0">
                {pointBurst?.id === q._id && <QuestionPointsBurst points={pointBurst.points} />}
                <QuestionStatusSelect
                  value={q.status}
                  onChange={(status) => onStatusChange(q._id, status)}
                  className="shrink-0"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
              {showScope && q.scope && <QuestionScopeChip scope={q.scope} />}
              <span>{formatDate(q.practiceDate ?? q.createdAt)}</span>
              <span className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5">
                {q.trackLabel || q.subjectName}
              </span>
              {q.link && (
                <a
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  Open link
                </a>
              )}
            </div>
            {showActions && (onEdit || onDelete) && (
              <div className="mt-3 flex justify-end gap-1">
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(q)}>
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(q._id)}>
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className={clsx(
          "hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:block",
          loading && "opacity-60"
        )}
      >
        <table className="w-full table-fixed border-separate border-spacing-y-1 text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className={`${questionCol} px-4 py-3 font-semibold`}>Question</th>
              {showScope && <th className={`${scopeCol} px-4 py-3 font-semibold`}>Scope</th>}
              <SortableHeader
                label="Status"
                field="status"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="w-[14%] px-4 py-3"
              />
              <SortableHeader
                label="Date"
                field="date"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="w-[12%] px-4 py-3"
              />
              <SortableHeader
                label="Track"
                field="track"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className={`${trackCol} px-4 py-3`}
              />
              <th className="w-[8%] px-4 py-3 font-semibold">Link</th>
              {showActions && <th className={`${actionsCol} px-4 py-3 font-semibold`} />}
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr
                key={q._id}
                className={clsx(
                  "question-row",
                  pointBurst?.id === q._id && "question-row-points-flash"
                )}
                style={questionRowVars(q.status)}
              >
                <td className="qs-row-cell px-4 py-3.5 text-[var(--foreground)]">
                  <ExpandableQuestionContent
                    content={q.content}
                    collapsedClassName="line-clamp-2"
                    className="font-medium"
                  />
                </td>
                {showScope && (
                  <td className="qs-row-cell px-4 py-3.5">
                    {q.scope ? <QuestionScopeChip scope={q.scope} /> : "—"}
                  </td>
                )}
                <td className="qs-row-cell px-4 py-3.5">
                  <div className="relative inline-block w-full max-w-[10rem]">
                    {pointBurst?.id === q._id && <QuestionPointsBurst points={pointBurst.points} />}
                    <QuestionStatusSelect
                      value={q.status}
                      onChange={(status) => onStatusChange(q._id, status)}
                      className="w-full"
                    />
                  </div>
                </td>
                <td className="qs-row-cell truncate px-4 py-3.5 text-[var(--muted)]">
                  {formatDate(q.practiceDate ?? q.createdAt)}
                </td>
                <td className="qs-row-cell truncate px-4 py-3.5">
                  <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--muted)]">
                    {q.trackLabel || q.subjectName}
                  </span>
                </td>
                <td className="qs-row-cell px-4 py-3.5">
                  {q.link ? (
                    <a
                      href={q.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                {showActions && (
                  <td className="qs-row-cell px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(q)}>
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(q._id)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
