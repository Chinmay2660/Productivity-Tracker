"use client";

import Button from "@/components/ui/Button";
import { TABLE_PAGE_SIZE } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  total: number;
  pageSize?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  summaryExtra?: string;
};

export default function TablePagination({
  page,
  total,
  pageSize = TABLE_PAGE_SIZE,
  loading = false,
  onPageChange,
  summaryExtra,
}: TablePaginationProps) {
  if (total <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--muted)]">
        Showing {start}–{end} of {total}
        {summaryExtra ? ` · ${summaryExtra}` : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="px-2 text-sm text-[var(--muted)]">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
