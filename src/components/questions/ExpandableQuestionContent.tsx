"use client";

import { useState } from "react";
import clsx from "clsx";
import { isExpandableQuestion } from "@/lib/utils";

export default function ExpandableQuestionContent({
  content,
  className,
  collapsedClassName = "line-clamp-3",
}: {
  content: string;
  className?: string;
  collapsedClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandable = isExpandableQuestion(content);

  return (
    <div className={className}>
      <p
        className={clsx(
          "text-sm whitespace-pre-wrap text-[var(--foreground)]",
          !expanded && expandable && collapsedClassName
        )}
      >
        {content}
      </p>
      {expandable && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-medium text-brand hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
