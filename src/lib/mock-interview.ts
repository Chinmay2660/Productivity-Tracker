import Subject from "@/models/Subject";
import PracticeQuestion from "@/models/PracticeQuestion";
import QuestionProgress from "@/models/QuestionProgress";
import type { MockInterviewQuestion } from "@/types";

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export async function pickMockInterviewQuestions(
  groupId: string,
  intervieweeId: string
): Promise<MockInterviewQuestion[]> {
  const doneProgress = await QuestionProgress.find({
    userId: intervieweeId,
    status: "done",
  }).lean();
  const doneQuestionIds = new Set(doneProgress.map((p) => String(p.questionId)));
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
    const picked = pickRandom(pool);
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

// ponytail: naive random pick from done pool; upgrade path is weighted sampling by confidence/recency
if (process.env.NODE_ENV !== "production") {
  const r = pickRandom([1, 2, 3]);
  console.assert(r !== undefined && [1, 2, 3].includes(r), "pickRandom should return an item from the list");
}
