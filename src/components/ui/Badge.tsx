import clsx from "clsx";
import Chip, { type ChipVariant } from "@/components/ui/Chip";
import { PRIORITY_META } from "@/lib/utils";
import type { Priority } from "@/types";

const PRIORITY_VARIANT: Record<Priority, ChipVariant> = {
  critical: "danger",
  high: "brand",
  medium: "warning",
  low: "muted",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <Chip variant={PRIORITY_VARIANT[priority]} className="!font-medium">
      {meta.label}
    </Chip>
  );
}

export function StatusBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const chipVariant: ChipVariant =
    variant === "default" ? "muted" : variant;
  return (
    <Chip variant={chipVariant} className={clsx("capitalize", variant === "default" && "!font-medium")}>
      {label}
    </Chip>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const map: Record<string, { label: string; variant: ChipVariant }> = {
    weak: { label: "Weak", variant: "danger" },
    okay: { label: "Okay", variant: "warning" },
    strong: { label: "Strong", variant: "success" },
  };
  const m = map[confidence] ?? map.weak;
  return <Chip variant={m.variant}>{m.label}</Chip>;
}
