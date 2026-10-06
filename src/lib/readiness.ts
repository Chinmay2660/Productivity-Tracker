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

  // Topic completion (35%)
  const readyStatuses: TopicStatus[] = ["revised", "interview_ready"];
  const topicScore =
    topics.length > 0
      ? (topics.filter((t) => readyStatuses.includes(t.status)).length / topics.length) * 100
      : 0;

  // Confidence (25%)
  const confidenceMap = { weak: 20, okay: 60, strong: 100 };
  const confidenceScore =
    topics.length > 0
      ? topics.reduce((sum, t) => sum + confidenceMap[t.confidence], 0) / topics.length
      : 0;

  // Task completion (15%)
  const taskScore =
    tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : topics.length > 0 ? 50 : 0;

  // Mock interview average (10%)
  const mockScore =
    mockScores.length > 0
      ? mockScores.reduce((a, b) => a + b, 0) / mockScores.length
      : 50;

  // Consistency/streak (10%)
  const streakScore = Math.min(studyStreak * 12.5, 100);

  // Urgency penalty — incomplete topics weigh more as interview nears
  let urgencyBonus = 0;
  if (daysUntilInterview <= 7 && topics.length > 0) {
    const incompleteRatio =
      topics.filter((t) => !readyStatuses.includes(t.status)).length / topics.length;
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
