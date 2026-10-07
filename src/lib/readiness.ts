import type { Confidence, TopicStatus } from "@/types";

interface ReadinessInput {
  topics: { status: TopicStatus; confidence: Confidence }[];
  tasksCompleted: number;
  tasksTotal: number;
  mockScores: number[];
  studyStreak: number;
  daysUntilInterview: number;
}

export function calculateReadiness(input: ReadinessInput): number {
  const { topics, tasksCompleted, tasksTotal, mockScores, studyStreak, daysUntilInterview } =
    input;

  const readyStatuses: TopicStatus[] = ["revised", "interview_ready"];
  // Only topics the user has started count — defaults on untouched topics shouldn't inflate score
  const engagedTopics = topics.filter((t) => t.status !== "not_started");

  // Topic completion (35%)
  const topicScore =
    engagedTopics.length > 0
      ? (engagedTopics.filter((t) => readyStatuses.includes(t.status)).length /
          engagedTopics.length) *
        100
      : 0;

  // Confidence (25%)
  const confidenceMap = { weak: 20, okay: 60, strong: 100 };
  const confidenceScore =
    engagedTopics.length > 0
      ? engagedTopics.reduce((sum, t) => sum + confidenceMap[t.confidence], 0) /
        engagedTopics.length
      : 0;

  // Task completion (15%) — no free points when there are no tasks
  const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

  // Mock interview average (10%) — no free points when no mocks taken
  const mockScore =
    mockScores.length > 0
      ? mockScores.reduce((a, b) => a + b, 0) / mockScores.length
      : 0;

  // Consistency/streak (10%)
  const streakScore = Math.min(studyStreak * 12.5, 100);

  // Urgency penalty — incomplete topics weigh more as interview nears
  let urgencyBonus = 0;
  if (daysUntilInterview <= 7 && engagedTopics.length > 0) {
    const incompleteRatio =
      engagedTopics.filter((t) => !readyStatuses.includes(t.status)).length /
      engagedTopics.length;
    urgencyBonus = (1 - incompleteRatio) * 5;
  }

  const raw =
    topicScore * 0.35 +
    confidenceScore * 0.25 +
    taskScore * 0.15 +
    mockScore * 0.1 +
    streakScore * 0.1 +
    urgencyBonus;

  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function getInterviewCountdown(interviewDate?: string | Date | null) {
  if (!interviewDate) {
    return { days: 0, hours: 0, totalHours: 0, isPast: false, hasDate: false };
  }
  const target = new Date(interviewDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, totalHours: 0, isPast: true, hasDate: true };
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return { days, hours, totalHours, isPast: false, hasDate: true };
}

export function getReadinessColor(percent: number): string {
  if (percent >= 80) return "text-emerald-600";
  if (percent >= 60) return "text-amber-600";
  if (percent >= 40) return "text-orange-600";
  return "text-red-600";
}

export function getReadinessLabel(percent: number): string {
  if (percent >= 85) return "Interview Ready";
  if (percent >= 70) return "Almost Ready";
  if (percent >= 50) return "Making Progress";
  if (percent >= 30) return "Needs Focus";
  return "Just Getting Started";
}

export function getReadinessBarColor(percent: number): string {
  if (percent >= 80) return "bg-emerald-500";
  if (percent >= 60) return "bg-amber-500";
  if (percent >= 40) return "bg-orange-500";
  return "bg-red-500";
}

// ponytail: self-check — run with `npx tsx src/lib/readiness.ts`
const isDirectRun =
  typeof process !== "undefined" && process.argv[1]?.includes("readiness");
if (isDirectRun) {
  const zero = calculateReadiness({
    topics: [],
    tasksCompleted: 0,
    tasksTotal: 0,
    mockScores: [],
    studyStreak: 0,
    daysUntilInterview: 30,
  });
  const untouched = calculateReadiness({
    topics: [{ status: "not_started", confidence: "weak" }],
    tasksCompleted: 0,
    tasksTotal: 0,
    mockScores: [],
    studyStreak: 0,
    daysUntilInterview: 30,
  });
  console.assert(zero === 0, `expected 0% for no activity, got ${zero}%`);
  console.assert(untouched === 0, `expected 0% for untouched topics, got ${untouched}%`);
  console.log("readiness self-check passed");
}
