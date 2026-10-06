"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

type CheckboxProps = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export default function Checkbox({
  checked,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel ?? (checked ? "Mark incomplete" : "Mark complete")}
      disabled={disabled}
      onClick={onChange}
      className={clsx("ui-checkbox", checked && "ui-checkbox-checked", className)}
    >
      {checked ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
    </button>
  );
}
