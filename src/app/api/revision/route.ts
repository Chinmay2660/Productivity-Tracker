import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { isGroupMember } from "@/lib/services";
import { isReviewRating, scheduleNextReview } from "@/lib/spaced-repetition";
import PracticeQuestion from "@/models/PracticeQuestion";
import QuestionProgress from "@/models/QuestionProgress";
import Subject from "@/models/Subject";
import Group from "@/models/Group";

const DEFAULT_BATCH = 40;
const MAX_BATCH = 100;

/**
 * Questions due for review, weakest first. Returns a capped batch plus the total due,
 * so a large backlog doesn't ship hundreds of cards to the browser at once.
 */
export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const summary = searchParams.get("summary") === "1";
  const limit = Math.min(MAX_BATCH, Math.max(1, parseInt(searchParams.get("limit") ?? "", 10) || DEFAULT_BATCH));
  if (!groupId) return jsonError("groupId is required");

  const group = await Group.findById(groupId).select("_id members createdBy").lean();
  if (!group || !isGroupMember(group, userId)) return jsonError("Not a member of this group", 403);

  // Start from what's due (a small set), then keep only questions that belong to this group.
  const due = await QuestionProgress.find({ userId, nextReviewAt: { $lte: new Date() } })
    .select("questionId confidence notes reviewCount lastTimeSpentSec nextReviewAt")
    .sort({ nextReviewAt: 1 })
    .lean();
  if (due.length === 0) return jsonOk(summary ? { dueCount: 0 } : { dueCount: 0, items: [] });

  const questions = await PracticeQuestion.find({
    _id: { $in: due.map((p) => p.questionId) },
    groupId,
    $or: [{ scope: "group" }, { scope: "personal", userId }],
  })
    .select("_id subjectId content difficulty link")
    .lean();
  const byId = new Map(questions.map((q) => [String(q._id), q]));
  const inGroup = due.filter((p) => byId.has(String(p.questionId)));

  if (summary) return jsonOk({ dueCount: inGroup.length });

  // Weakest first, then most overdue (the list is already ordered by due date).
  const rank = { weak: 0, okay: 1, strong: 2 } as const;
  const batch = [...inGroup].sort((a, b) => rank[a.confidence] - rank[b.confidence]).slice(0, limit);

  const subjects = await Subject.find({ _id: { $in: batch.map((p) => byId.get(String(p.questionId))!.subjectId) } })
    .select("_id name")
    .lean();
  const subjectName = new Map(subjects.map((s) => [String(s._id), s.name]));

  const items = batch.map((p) => {
    const q = byId.get(String(p.questionId))!;
    return {
      questionId: String(q._id),
      content: q.content,
      link: q.link,
      difficulty: q.difficulty,
      subjectName: subjectName.get(String(q.subjectId)) ?? "General",
      confidence: p.confidence,
      notes: p.notes,
      reviewCount: p.reviewCount ?? 0,
      lastTimeSpentSec: p.lastTimeSpentSec,
      nextReviewAt: p.nextReviewAt?.toISOString(),
    };
  });

  return jsonOk({ dueCount: inGroup.length, items });
}, "Failed to load revision queue");

/** Record a review: { questionId, rating, timeSpentSec? } */
export const POST = withAuth(async (request, { userId }) => {
  const { questionId, rating, timeSpentSec } = await request.json();
  if (!questionId) return jsonError("questionId is required");
  if (!isReviewRating(rating)) return jsonError("rating must be again, hard, good or easy");

  const progress = await QuestionProgress.findOne({ userId, questionId }).lean();
  if (!progress) return jsonError("No progress for this question", 404);

  const next = scheduleNextReview(progress.reviewCount ?? 0, rating);
  const updated = await QuestionProgress.findOneAndUpdate(
    { userId, questionId },
    {
      reviewCount: next.reviewCount,
      nextReviewAt: next.nextReviewAt,
      confidence: next.confidence,
      lastReviewedAt: new Date(),
      lastPracticed: new Date(),
      ...(typeof timeSpentSec === "number" && timeSpentSec >= 0
        ? { lastTimeSpentSec: Math.round(timeSpentSec) }
        : {}),
    },
    { new: true }
  ).lean();

  return jsonOk({
    questionId: String(questionId),
    nextReviewAt: updated?.nextReviewAt?.toISOString(),
    confidence: updated?.confidence,
    reviewCount: updated?.reviewCount ?? 0,
  });
}, "Failed to record review");
