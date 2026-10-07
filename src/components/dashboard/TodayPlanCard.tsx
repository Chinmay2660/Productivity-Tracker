"use client";

import Link from "next/link";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import QuestionListView from "@/components/questions/QuestionListView";
import type { QuestionPointBurst } from "@/lib/question-points-burst";
import type { QuestionStatus, TodayQuestion } from "@/types";

function QuestionSection({
  title,
  subtitle,
  questions,
  emptyMessage,
  onStatusChange,
  pointBurst,
}: {
  title: string;
  subtitle: string;
  questions: TodayQuestion[];
  emptyMessage: string;
  onStatusChange: (id: string, status: QuestionStatus) => void;
  pointBurst?: QuestionPointBurst | null;
}) {
  if (questions.length === 0) {
    return (
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          <Chip variant="muted" className="!px-2 !py-0.5 !text-[10px]">0</Chip>
        </div>
        <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          <Chip variant="muted" className="!px-2 !py-0.5 !text-[10px]">{questions.length}</Chip>
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>
      </div>
      <QuestionListView
        questions={questions}
        onStatusChange={onStatusChange}
        pointBurst={pointBurst}
      />
    </div>
  );
}

export default function TodayPlanCard({
  todayQuestions,
  onStatusChange,
  pointBurst = null,
}: {
  todayQuestions: { group: TodayQuestion[]; personal: TodayQuestion[] };
  onStatusChange: (id: string, status: QuestionStatus) => void;
  pointBurst?: QuestionPointBurst | null;
}) {
  const groupCount = todayQuestions.group.length;
  const personalCount = todayQuestions.personal.length;
  const total = groupCount + personalCount;

  return (
    <Card>
      <CardHeader
        title="Today's Questions"
        subtitle={
          total === 0
            ? "No questions scheduled for today"
            : `${groupCount} group · ${personalCount} personal`
        }
        action={
          <Link href="/questions">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        }
      />
      {total === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Add group or personal questions with today&apos;s practice date to see them here.
        </p>
      ) : (
        <div className="space-y-6">
          <QuestionSection
            title="Group"
            subtitle="Shared with everyone — each member tracks their own progress"
            questions={todayQuestions.group}
            emptyMessage="No group questions for today."
            onStatusChange={onStatusChange}
            pointBurst={pointBurst}
          />
          <QuestionSection
            title="Personal"
            subtitle="Only you — your private practice questions"
            questions={todayQuestions.personal}
            emptyMessage="No personal questions for today."
            onStatusChange={onStatusChange}
            pointBurst={pointBurst}
          />
        </div>
      )}
    </Card>
  );
}
