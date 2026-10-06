import { ReactNode } from "react";
import clsx from "clsx";
import Label from "./Label";

export default function FormField({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-1", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
