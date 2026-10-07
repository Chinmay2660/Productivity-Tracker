"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-hover active:brightness-95 focus-visible:shadow-focus disabled:opacity-50",
  secondary:
    "bg-stone-900 text-white hover:bg-stone-800 focus-visible:shadow-focus dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white disabled:opacity-50",
  outline:
    "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--chip-bg-hover)] focus-visible:shadow-focus disabled:opacity-50",
  danger:
    "bg-danger text-white hover:brightness-110 focus-visible:shadow-focus disabled:opacity-50",
  ghost:
    "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:shadow-focus disabled:opacity-50",
};

const SIZE: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
