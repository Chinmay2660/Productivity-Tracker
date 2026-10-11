"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import toast from "react-hot-toast";

export default function QuestionDescriptionBlock({
  description,
  collapsible,
  expanded,
  collapsedClassName = "line-clamp-3",
}: {
  description: string;
  collapsible?: boolean;
  expanded?: boolean;
  collapsedClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(description);
      toast.success("Description copied");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="relative">
      <pre
        className={clsx(
          "max-h-[min(24rem,50vh)] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 pr-11 font-mono text-xs leading-relaxed text-[var(--foreground)] whitespace-pre-wrap",
          collapsible && !expanded && collapsedClassName
        )}
      >
        <code className="font-mono text-[length:inherit]">{description}</code>
      </pre>
      <IconButton
        label="Copy description"
        className="absolute top-1.5 right-1.5 bg-[var(--surface-muted)]/80 backdrop-blur-sm"
        onClick={copy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-success" strokeWidth={2} aria-hidden />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
      </IconButton>
    </div>
  );
}
