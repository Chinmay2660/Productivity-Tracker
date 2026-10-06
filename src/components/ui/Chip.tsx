import type { ReactNode } from "react";
import clsx from "clsx";

export type ChipVariant =
  | "default"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const VARIANT_CLASS: Record<ChipVariant, string> = {
  default: "chip chip-default",
  brand: "chip chip-brand",
  success: "chip chip-success",
  warning: "chip chip-warning",
  danger: "chip chip-danger",
  info: "chip chip-info",
  muted: "chip chip-muted",
};

type ChipProps = {
  children: ReactNode;
  variant?: ChipVariant;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function Chip({
  children,
  variant = "default",
  active = false,
  onClick,
  className,
}: ChipProps) {
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={clsx(
        VARIANT_CLASS[variant],
        active && "chip-active",
        onClick && variant === "brand" && "chip-toggle",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </Tag>
  );
}
