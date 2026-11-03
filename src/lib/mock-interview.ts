import Subject from "@/models/Subject";
import PracticeQuestion from "@/models/PracticeQuestion";
import QuestionProgress from "@/models/QuestionProgress";
import type { MockInterviewQuestion } from "@/types";

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

const CONFIDENCE_WEIGHT = { weak: 5, okay: 2, strong: 1 } as const;

/** Weighted sample: weaker-confidence questions are more likely to be asked. */
function pickWeighted<T>(items: T[], weight: (item: T) => number): T | undefined {
  if (items.length === 0) return undefined;
  const weights = items.map((i) => Math.max(0.1, weight(i)));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export async function pickMockInterviewQuestions(
  groupId: string,
  intervieweeId: string
): Promise<MockInterviewQuestion[]> {
  const doneProgress = await QuestionProgress.find({
    userId: intervieweeId,
    // "revised" is a completed question too.
    status: { $in: ["done", "revised"] },
  }).lean();
  const doneQuestionIds = new Set(doneProgress.map((p) => String(p.questionId)));
  const confidenceById = new Map(doneProgress.map((p) => [String(p.questionId), p.confidence]));
  if (doneQuestionIds.size === 0) return [];

  const subjects = await Subject.find({
    groupId,
    scope: "group",
    isActive: true,
    useForMockInterview: true,
  })
    .sort({ order: 1 })
    .lean();
  if (subjects.length === 0) return [];

  const groupQuestions = await PracticeQuestion.find({ groupId, scope: "group" }).lean();
  const questions: MockInterviewQuestion[] = [];

  for (const subject of subjects) {
    const subjectId = String(subject._id);
    const pool = groupQuestions.filter(
      (q) => String(q.subjectId) === subjectId && doneQuestionIds.has(String(q._id))
    );
    const picked = pickWeighted(
      pool,
      (q) => CONFIDENCE_WEIGHT[confidenceById.get(String(q._id)) ?? "weak"]
    );
    if (!picked) continue;

    questions.push({
      subjectId,
      subjectName: subject.name,
      topicId: picked.topicId ? String(picked.topicId) : undefined,
      questionId: String(picked._id),
      question: picked.content,
      source: "practice",
    });
  }

  return questions;
}

if (process.env.NODE_ENV !== "production") {
  const r = pickRandom([1, 2, 3]);
  console.assert(r !== undefined && [1, 2, 3].includes(r), "pickRandom should return an item from the list");
}
