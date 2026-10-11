"use client";

import { useState } from "react";
import { isExpandableQuestion, splitQuestionFields } from "@/lib/utils";
import QuestionDescriptionBlock from "@/components/questions/QuestionDescriptionBlock";

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
  const { title, description } = splitQuestionFields(content);
  const expandable = isExpandableQuestion(content);

  return (
    <div className={className}>
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      {description ? (
        <QuestionDescriptionBlock
          description={description}
          collapsible={expandable}
          expanded={expanded}
          collapsedClassName={collapsedClassName}
        />
      ) : null}
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
