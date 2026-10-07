import type { QuestionsByDate } from "@/types";
import { questionPracticeDay } from "@/lib/utils";

type QuestionRow = { subjectId: unknown; practiceDate?: Date | string; createdAt: Date | string };
type QuestionRowWithId = QuestionRow & { _id: unknown };

type SubjectQuestionStats = { count: number; byDate: Map<string, number> };

export function buildQuestionStats(questions: QuestionRow[]) {
  const bySubject = new Map<string, { count: number; byDate: Map<string, number> }>();
  for (const q of questions) {
    const sid = String(q.subjectId);
    if (!bySubject.has(sid)) bySubject.set(sid, { count: 0, byDate: new Map() });
    const entry = bySubject.get(sid)!;
    entry.count++;
    const date = questionPracticeDay(q);
    entry.byDate.set(date, (entry.byDate.get(date) ?? 0) + 1);
  }
  return bySubject;
}

export function buildGroupDoneQuestionStats(
  questions: QuestionRowWithId[],
  memberIds: string[],
  progress: { userId: unknown; questionId: unknown; status: string }[]
): Map<string, SubjectQuestionStats> {
  const bySubject = new Map<string, SubjectQuestionStats>();
  const memberCount = memberIds.length;
  if (memberCount === 0 || questions.length === 0) return bySubject;

  const doneCountByQuestion = new Map<string, number>();
  for (const row of progress) {
    if (row.status !== "done") continue;
    const qid = String(row.questionId);
    doneCountByQuestion.set(qid, (doneCountByQuestion.get(qid) ?? 0) + 1);
  }

  for (const q of questions) {
    const qid = String(q._id);
    if ((doneCountByQuestion.get(qid) ?? 0) < memberCount) continue;

    const sid = String(q.subjectId);
    if (!bySubject.has(sid)) bySubject.set(sid, { count: 0, byDate: new Map() });
    const entry = bySubject.get(sid)!;
    entry.count++;
    const date = questionPracticeDay(q);
    entry.byDate.set(date, (entry.byDate.get(date) ?? 0) + 1);
  }

  return bySubject;
}

export function toQuestionsByDate(byDate: Map<string, number>): QuestionsByDate[] {
  return Array.from(byDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function countQuestionsOnDay(
  questions: QuestionRow[],
  day: string
): number {
  return questions.filter((q) => questionPracticeDay(q) === day).length;
}
