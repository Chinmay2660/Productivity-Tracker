import { QUESTION_STATUS_META, normalizeQuestionStatus } from "@/lib/utils";
import type { QuestionStatus } from "@/types";

export default function QuestionStatusPill({ status }: { status: QuestionStatus }) {
  const key = normalizeQuestionStatus(status);
  return (
    <span className={`question-status-pill qs-${key}`}>
      {QUESTION_STATUS_META[key].label}
    </span>
  );
}
