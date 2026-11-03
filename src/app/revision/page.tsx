"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useUser } from "@/components/providers/UserProvider";
import { apiGet, apiPost, getErrorMessage } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";
import type { ReviewRating } from "@/lib/spaced-repetition";

type DueItem = {
  questionId: string;
  content: string;
  link?: string;
  difficulty: string;
  subjectName: string;
  confidence: "weak" | "okay" | "strong";
  notes?: string;
  reviewCount: number;
  lastTimeSpentSec?: number;
};

const RATINGS: { id: ReviewRating; label: string; hint: string; key: string }[] = [
  { id: "again", label: "Again", hint: "Forgot — see tomorrow", key: "1" },
  { id: "hard", label: "Hard", hint: "Shaky — repeat soon", key: "2" },
  { id: "good", label: "Good", hint: "Solid — space it out", key: "3" },
  { id: "easy", label: "Easy", hint: "Effortless — skip ahead", key: "4" },
];

function fmt(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function RevisionPage() {
  const { user } = useUser();
  const groupId = user?.activeGroupId;
  const [queue, setQueue] = useState<DueItem[]>([]);
  const [total, setTotal] = useState(0);
  // Cards due beyond the batch currently loaded.
  const [moreDue, setMoreDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await apiGet<{ items: DueItem[]; dueCount: number }>(`/api/revision?groupId=${groupId}`);
      setQueue(data.items);
      setTotal(data.items.length);
      setMoreDue(Math.max(0, data.dueCount - data.items.length));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load revision queue"));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = queue[0];

  // Restart the timer whenever a new card comes up.
  useEffect(() => {
    startedAt.current = Date.now();
    setElapsed(0);
    setRevealed(false);
  }, [current?.questionId]);

  useEffect(() => {
    if (!current) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [current]);

  const rate = useCallback(
    async (rating: ReviewRating) => {
      if (!current || saving) return;
      setSaving(true);
      try {
        await apiPost("/api/revision", {
          questionId: current.questionId,
          rating,
          timeSpentSec: Math.floor((Date.now() - startedAt.current) / 1000),
        });
        // "Again" cards come back at the end of this session too.
        setQueue((q) => (rating === "again" ? [...q.slice(1), q[0]] : q.slice(1)));
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to save review"));
      } finally {
        setSaving(false);
      }
    },
    [current, saving]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (!current) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const match = RATINGS.find((r) => r.key === e.key);
        if (match) void rate(match.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, rate]);

  if (!groupId) {
    return <EmptyState title="No active group" description="Join or create a group to start reviewing." />;
  }
  if (loading) return <LoadingState message="Loading your review queue…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const done = total - queue.length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Revision"
        description="Spaced repetition: questions come back right before you'd forget them."
      />

      {!current ? (
        <EmptyState
          title={total > 0 ? "Queue cleared 🎉" : "Nothing due for review"}
          description={
            total > 0
              ? moreDue > 0
                ? `You reviewed ${total} question${total === 1 ? "" : "s"}. ${moreDue} more are due.`
                : `You reviewed ${total} question${total === 1 ? "" : "s"}. Come back tomorrow.`
              : "Mark questions as done or revised and they'll show up here on a schedule."
          }
          action={
            moreDue > 0 ? (
              <Button size="sm" onClick={() => void load()}>
                Review next batch ({moreDue} more due)
              </Button>
            ) : (
              <Link href="/questions">
                <Button size="sm">Go to questions</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>
                {done} of {total} reviewed
              </span>
              <span aria-label="Time on this question">⏱ {fmt(elapsed)}</span>
            </div>
            <ProgressBar value={total ? (done / total) * 100 : 0} />
          </div>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span className="font-semibold">{current.subjectName}</span>
              <span>· {current.difficulty}</span>
              <span>· confidence: {current.confidence}</span>
              {current.reviewCount > 0 && <span>· reviewed {current.reviewCount}×</span>}
              {current.lastTimeSpentSec != null && <span>· last time {fmt(current.lastTimeSpentSec)}</span>}
            </div>
            <p className="whitespace-pre-wrap text-base leading-relaxed">{current.content}</p>

            {!revealed ? (
              <Button onClick={() => setRevealed(true)} className="w-full">
                Show my notes <span className="ml-2 text-xs opacity-70">(Space)</span>
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-[var(--surface-muted)] p-3 text-sm">
                  {current.notes ? (
                    <p className="whitespace-pre-wrap">{current.notes}</p>
                  ) : (
                    <p className="text-[var(--muted)]">You haven&apos;t saved notes for this question.</p>
                  )}
                  {current.link && (
                    <a
                      href={current.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-brand underline"
                    >
                      Open reference
                    </a>
                  )}
                </div>
                <p className="text-xs font-medium">How well did you recall it?</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {RATINGS.map((r) => (
                    <Button
                      key={r.id}
                      variant="outline"
                      size="sm"
                      loading={saving}
                      onClick={() => void rate(r.id)}
                      className="flex-col !items-start !py-2 text-left"
                      title={r.hint}
                    >
                      <span>
                        {r.label} <span className="text-xs opacity-60">({r.key})</span>
                      </span>
                      <span className="text-[10px] font-normal text-[var(--muted)]">{r.hint}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
