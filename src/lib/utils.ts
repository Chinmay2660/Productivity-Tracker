import { ProgressStatus } from "@/types/progress";

export function jsonOk<T>(data: T, init?: number) {
  return Response.json({ success: true, data }, { status: init ?? 200 });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export const STATUS_ORDER: ProgressStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "DONE",
  "REVISED",
];

export const STATUS_META: Record<
  ProgressStatus,
  { label: string; emoji: string; bg: string; border: string; text: string; dot: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    emoji: "🔴",
    bg: "bg-status-notStarted",
    border: "border-status-notStartedBorder",
    text: "text-status-notStartedText",
    dot: "#EB5953",
  },
  IN_PROGRESS: {
    label: "In Progress",
    emoji: "🟡",
    bg: "bg-status-inProgress",
    border: "border-status-inProgressBorder",
    text: "text-status-inProgressText",
    dot: "#F3BF39",
  },
  DONE: {
    label: "Done",
    emoji: "🟢",
    bg: "bg-status-done",
    border: "border-status-doneBorder",
    text: "text-status-doneText",
    dot: "#46AF6A",
  },
  REVISED: {
    label: "Revised",
    emoji: "🩷",
    bg: "bg-status-revised",
    border: "border-status-revisedBorder",
    text: "text-status-revisedText",
    dot: "#CB41A2",
  },
};

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toDateOnlyString(date: string | Date): string {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .split("T")[0];
}

// Date-only inputs (yyyy-mm-dd) are parsed by `new Date(str)` as UTC midnight.
// To keep "today"/"this week" comparisons consistent regardless of the
// viewer's local timezone offset, all day-boundary math here is done in UTC —
// otherwise a UTC+ timezone could see "today" resolve to a different
// calendar day than the one stored for a task created moments earlier.
export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

export function getDateRangeForQuickFilter(
  filter: "today" | "yesterday" | "week" | "month" | "all"
): { start?: Date; end?: Date } {
  const now = new Date();
  switch (filter) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setUTCDate(y.getUTCDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "week": {
      const start = new Date(now);
      const day = start.getUTCDay();
      const diff = start.getUTCDate() - day + (day === 0 ? -6 : 1);
      start.setUTCDate(diff);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "month": {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "all":
    default:
      return {};
  }
}

export function resolveFilterRange(filters: {
  quickFilter: string;
  customStart: string;
  customEnd: string;
}): { start?: string; end?: string } {
  if (filters.quickFilter === "custom") {
    return {
      start: filters.customStart || undefined,
      end: filters.customEnd || undefined,
    };
  }
  const range = getDateRangeForQuickFilter(
    filters.quickFilter as "today" | "yesterday" | "week" | "month" | "all"
  );
  return {
    start: range.start?.toISOString(),
    end: range.end?.toISOString(),
  };
}

export function getMotivationalRemark(percent: number, hasRevised: boolean): string {
  if (hasRevised && percent >= 100) {
    return "🩷 Great! You're revising previously completed questions.";
  }
  if (percent >= 100) {
    return "🔥 Excellent work! You completed everything for today.";
  }
  if (percent > 0) {
    return "🟡 Good progress. A few tasks are still remaining.";
  }
  return "🔴 You haven't completed today's tasks yet. Time to get started!";
}
