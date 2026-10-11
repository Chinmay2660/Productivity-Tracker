import { normalizeQuestionStatus } from "@/lib/utils";
import type { Confidence, QuestionStatus } from "@/types";

type ProgressRow = {
  status?: string;
  confidence?: string;
  lastPracticed?: Date | string;
  notes?: string;
  pointsAwarded?: number;
  firstCompletedAt?: Date | string;
} | null | undefined;

type QuestionRow = {
  status?: string;
  confidence?: string;
  lastPracticed?: Date | string;
  notes?: string;
  pointsAwarded?: number;
  firstCompletedAt?: Date | string;
};

/** Per-user status for group or personal questions (QuestionProgress wins; doc fields are legacy fallback). */
export function questionStatusForUser(
  progress: ProgressRow,
  question?: QuestionRow
): QuestionStatus {
  return normalizeQuestionStatus(progress?.status ?? question?.status ?? "not_started");
}

export function questionProgressFields(
  progress: ProgressRow,
  question?: QuestionRow
): {
  status: QuestionStatus;
  confidence: Confidence;
  lastPracticed?: string;
  notes?: string;
  pointsAwarded?: number;
  firstCompletedAt?: string;
} {
  const status = questionStatusForUser(progress, question);
  const confidence = (progress?.confidence ?? question?.confidence ?? "weak") as Confidence;
  const lastPracticed = progress?.lastPracticed ?? question?.lastPracticed;
  const notes = progress?.notes ?? question?.notes;
  const pointsAwarded = progress?.pointsAwarded ?? question?.pointsAwarded;
  const firstCompletedAt = progress?.firstCompletedAt ?? question?.firstCompletedAt;

  return {
    status,
    confidence,
    ...(lastPracticed
      ? { lastPracticed: new Date(lastPracticed).toISOString() }
      : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(pointsAwarded != null ? { pointsAwarded } : {}),
    ...(firstCompletedAt
      ? { firstCompletedAt: new Date(firstCompletedAt).toISOString() }
      : {}),
  };
}
