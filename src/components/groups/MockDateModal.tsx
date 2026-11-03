"use client";

import clsx from "clsx";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { APP_TIMEZONE, parseAppDateTime, toDateTimeLocalValue } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-brand/40";

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
}

/** Start times in 15-minute slots across the day. */
const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

/** "value" is a datetime-local string in IST (YYYY-MM-DDTHH:mm). */
export default function MockDateModal({
  open,
  onClose,
  value,
  onChange,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [now] = useState(() => Date.now());
  const [datePart = "", timePart = ""] = value.split("T");
  const setDate = (d: string) => onChange(`${d}T${timePart || "14:00"}`);
  // Keep an off-grid time (set before slots existed) selectable instead of silently changing it.
  const timeOptions = timePart && !TIME_SLOTS.includes(timePart) ? [timePart, ...TIME_SLOTS] : TIME_SLOTS;
  const setTime = (t: string) => onChange(`${datePart || toDateTimeLocalValue(new Date(now)).slice(0, 10)}T${t}`);

  const complete = datePart !== "" && timePart !== "";
  const parsed = complete ? parseAppDateTime(value) : null;
  const preview = parsed
    ? {
        day: parsed.toLocaleDateString("en-IN", {
          timeZone: APP_TIMEZONE,
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        time: fmtTime(timePart),
        rel: (() => {
          const diff = Math.round((parsed.getTime() - now) / 86_400_000);
          if (diff === 0) return "today";
          if (diff === 1) return "tomorrow";
          if (diff > 1) return `in ${diff} days`;
          return "in the past";
        })(),
      }
    : null;

  return (
    <Modal open={open} onClose={onClose} title="Schedule group mock" size="sm">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (complete) onSave();
        }}
      >
        <div
          className={clsx(
            "flex items-center gap-3 rounded-xl border p-3.5",
            preview ? "border-brand/30 bg-brand/10" : "border-dashed border-[var(--border)] bg-[var(--surface-muted)]"
          )}
          aria-live="polite"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <CalendarClock className="h-5 w-5" aria-hidden />
          </span>
          {preview ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{preview.day}</p>
              <p className="text-xs text-[var(--muted)]">
                {preview.time} IST · {preview.rel}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Pick a date and time</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-[var(--muted)]">
              Date
              <input
                type="date"
                value={datePart}
                onChange={(e) => setDate(e.target.value)}
                className={clsx(field, "mt-1")}
                required
              />
            </label>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Time (IST)
              <select
                value={timePart}
                onChange={(e) => setTime(e.target.value)}
                className={clsx(field, "mt-1")}
                required
              >
                <option value="" disabled>
                  Select
                </option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {fmtTime(t)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={saving} disabled={!complete}>
            {saving ? "Saving…" : "Save date"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
