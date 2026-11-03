"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type MultiSelectOption = { value: string; label: string };

/**
 * Dropdown with checkboxes. The list opens inline (not as a floating popover)
 * so it never gets clipped inside a modal or on small screens.
 */
export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "All",
  className,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = options.filter((o) => value.includes(o.value));
  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map((o) => o.label).join(", ")
        : `${selected.length} selected`;

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div ref={ref} className={clsx("w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-left text-sm text-[var(--foreground)]"
      >
        <span className={clsx("truncate", selected.length === 0 && "text-[var(--muted)]")}>{summary}</span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1"
        >
          {options.length === 0 && <li className="px-2 py-1.5 text-sm text-[var(--muted)]">No options</li>}
          {options.map((o) => {
            const on = value.includes(o.value);
            return (
              <li key={o.value} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-muted)]"
                >
                  <span
                    className={clsx(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-brand bg-brand text-white" : "border-[var(--input-border)]"
                    )}
                  >
                    {on && <Check className="h-3 w-3" aria-hidden />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
