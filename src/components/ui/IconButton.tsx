"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "default" | "danger";
};

export default function IconButton({
  label,
  variant = "default",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-wait disabled:opacity-50",
        variant === "danger"
          ? "text-[var(--muted)] hover:bg-danger/10 hover:text-danger"
          : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-brand",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
