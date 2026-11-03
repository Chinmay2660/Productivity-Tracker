export type ReviewRating = "again" | "hard" | "good" | "easy";

export const REVIEW_RATINGS: ReviewRating[] = ["again", "hard", "good", "easy"];

/** Base intervals in days, indexed by how many successful reviews came before. */
const LADDER = [1, 3, 7, 14, 30];
const DAY_MS = 86_400_000;

export function isReviewRating(value: unknown): value is ReviewRating {
  return typeof value === "string" && (REVIEW_RATINGS as string[]).includes(value);
}

/**
 * Next review state. "again" resets the ladder, "hard" repeats the current rung,
 * "good" climbs one, "easy" skips one.
 */
export function scheduleNextReview(
  reviewCount: number,
  rating: ReviewRating,
  now: Date = new Date()
): { reviewCount: number; nextReviewAt: Date; confidence: "weak" | "okay" | "strong" } {
  let next = reviewCount;
  if (rating === "again") next = 0;
  else if (rating === "good") next = reviewCount + 1;
  else if (rating === "easy") next = reviewCount + 2;
  next = Math.max(0, next);

  const rung = rating === "again" ? 0 : rating === "hard" ? Math.max(0, reviewCount) : next;
  const days = rating === "again" ? 1 : LADDER[Math.min(rung, LADDER.length - 1)];

  const confidence = rating === "again" ? "weak" : rating === "hard" ? "okay" : next >= 3 ? "strong" : "okay";
  return { reviewCount: next, nextReviewAt: new Date(now.getTime() + days * DAY_MS), confidence };
}

/** First review is due the day after a question is first completed. */
export function firstReviewDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + DAY_MS);
}
