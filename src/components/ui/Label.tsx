import clsx from "clsx";
import { LabelHTMLAttributes } from "react";

export default function Label({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={clsx("label", className)} {...props}>
      {children}
    </label>
  );
}
