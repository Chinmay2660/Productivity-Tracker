"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { apiGet, apiPatch, apiPost, getErrorMessage } from "@/lib/api";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Chip from "@/components/ui/Chip";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import { formatDate, formatDateTime, parseAppDateTime, toDateTimeLocalValue } from "@/lib/utils";
import toast from "react-hot-toast";
import type { MockInterviewSchedule, MockInterviewScheduleMember } from "@/types";

const STATUS_LABEL: Record<MockInterviewScheduleMember["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const STATUS_VARIANT: Record<
  MockInterviewScheduleMember["status"],
  "muted" | "warning" | "success"
> = {
  not_started: "muted",
  in_progress: "warning",
  completed: "success",
};

function roundTabLabel(round: MockInterviewSchedule["rounds"][number]) {
  if (round.interviewDate) return formatDate(round.interviewDate);
  if (round.isCurrent) return "Upcoming";
  return "No date";
}

function memberInterviewDate(
  member: MockInterviewScheduleMember,
  roundDate?: string | null
): string | null {
  return member.scheduledAt ?? roundDate ?? null;
}

const dateTimeInputClass =
  "input min-w-[15.5rem] w-[15.5rem] max-w-full !rounded-md !px-3 !py-2 !text-sm";

type ViewMode = "schedule" | "history";

function ViewModeTabs({
  mode,
  onChange,
  historyCount,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  historyCount: number;
}) {
  const tabs: { id: ViewMode; label: string }[] = [
    { id: "schedule", label: "Schedule" },
    { id: "history", label: historyCount > 0 ? `History (${historyCount})` : "History" },
  ];

  return (
    <div className="mb-4 flex rounded-lg bg-[var(--surface-muted)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            mode === tab.id
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-soft"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function GroupMockInterviewsTab({
  groupId,
  currentUserId,
}: {
  groupId: string;
  currentUserId?: string;
}) {
  const [schedule, setSchedule] = useState<MockInterviewSchedule | null>(null);
  const [activeRoundId, setActiveRoundId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [mockScore, setMockScore] = useState(70);
  const [mockWeaknesses, setMockWeaknesses] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [mockDate, setMockDate] = useState("");
  const [savingMockDate, setSavingMockDate] = useState(false);
  const [newMockDate, setNewMockDate] = useState("");
  const [addingMockDate, setAddingMockDate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  const [showNextMockForm, setShowNextMockForm] = useState(false);

  const load = useCallback(async (roundId?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const query = roundId ? `&roundId=${roundId}` : "";
      const data = await apiGet<MockInterviewSchedule>(
        `/api/mock-interviews/schedule?groupId=${groupId}${query}`
      );
      setSchedule(data);
      if (!roundId || roundId === data.activeRoundId) {
        setActiveRoundId(data.activeRoundId);
      }
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load mock interviews"));
      if (!silent) setSchedule(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [groupId]);

  const patchMemberScheduledAt = (userId: string, scheduledAt: string | null) => {
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        members: prev.members.map((m) =>
          m.userId === userId ? { ...m, scheduledAt } : m
        ),
      };
    });
  };

  const patchRoundAndMemberDates = (scheduledAt: string) => {
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rounds: prev.rounds.map((r) =>
          r._id === prev.activeRoundId ? { ...r, interviewDate: scheduledAt } : r
        ),
        members: prev.members.map((m) => ({ ...m, scheduledAt })),
      };
    });
  };

  useEffect(() => {
    load(activeRoundId || undefined);
  }, [load, activeRoundId]);

  const selected = schedule?.members.find((m) => m.userId === selectedId) ?? null;
  const activeRound = schedule?.rounds.find((r) => r._id === schedule.activeRoundId);
  const isHistory = viewMode === "history" || (schedule?.isViewingHistory ?? false);
  const pastRounds = schedule?.rounds.filter((r) => !r.isCurrent) ?? [];

  const switchViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setShowNextMockForm(false);
    if (!schedule) return;
    if (mode === "schedule" && schedule.currentRoundId) {
      setActiveRoundId(schedule.currentRoundId);
    } else if (mode === "history" && pastRounds.length > 0) {
      setActiveRoundId(pastRounds[pastRounds.length - 1]._id);
    }
  };

  useEffect(() => {
    setScheduledAt(toDateTimeLocalValue(selected?.scheduledAt));
  }, [selected?.userId, selected?.scheduledAt]);

  useEffect(() => {
    if (!activeRound?.interviewDate) {
      setMockDate("");
      return;
    }
    setMockDate(toDateTimeLocalValue(activeRound.interviewDate));
  }, [activeRound?.interviewDate, activeRound?._id]);

  const myRole = schedule?.members.find((m) => m.userId === currentUserId)?.role;
  const canManageGroup = myRole === "owner" || myRole === "admin";
  const isSelf = selectedId === currentUserId;
  const canGenerate =
    schedule?.canGenerate &&
    !isHistory &&
    selected &&
    !selected.session &&
    !isSelf &&
    currentUserId;
  const canScore =
    !isHistory &&
    selected?.session &&
    currentUserId &&
    !isSelf &&
    !selected.session.currentUserHasScored;

  const generateQuestions = async () => {
    if (!currentUserId || !selectedId || !schedule) return;
    setGenerating(true);
    try {
      const data = await apiPost<{
        intervieweeName: string;
        questions: unknown[];
      }>("/api/mock-interviews/generate", {
        intervieweeId: selectedId,
        groupId,
        roundId: schedule.activeRoundId,
      });
      toast.success(
        `Picked ${data.questions.length} done questions for ${data.intervieweeName}`
      );
      await load(schedule.activeRoundId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to generate questions"));
    } finally {
      setGenerating(false);
    }
  };

  const saveInterviewDate = async (value?: string | null) => {
    if (!selectedId || !schedule) return;
    const next = value === undefined ? scheduledAt : value;
    setSavingSchedule(true);
    try {
      const data = await apiPatch<{ intervieweeId: string; scheduledAt: string | null }>(
        "/api/mock-interviews/schedule",
        {
          action: "setInterviewDate",
          groupId,
          roundId: schedule.activeRoundId,
          intervieweeId: selectedId,
          scheduledAt: next ? parseAppDateTime(next).toISOString() : null,
        }
      );
      patchMemberScheduledAt(data.intervieweeId, data.scheduledAt);
      toast.success(next ? "Interview date saved" : "Date cleared");
      if (value === null) setScheduledAt("");
      void load(schedule.activeRoundId, true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save date"));
    } finally {
      setSavingSchedule(false);
    }
  };

  const saveMockDate = async () => {
    if (!schedule || !mockDate) return;
    setSavingMockDate(true);
    try {
      const data = await apiPatch<{ scheduledAt: string }>("/api/mock-interviews/schedule", {
        action: "setMockDate",
        groupId,
        roundId: schedule.activeRoundId,
        scheduledAt: parseAppDateTime(mockDate).toISOString(),
      });
      patchRoundAndMemberDates(data.scheduledAt);
      toast.success("Mock interview date saved");
      void load(schedule.activeRoundId, true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save mock date"));
    } finally {
      setSavingMockDate(false);
    }
  };

  const addMockDate = async () => {
    if (!newMockDate) return;
    setAddingMockDate(true);
    try {
      const data = await apiPatch<{ roundId: string; interviewDate: string }>(
        "/api/mock-interviews/schedule",
        {
          action: "addMockDate",
          groupId,
          interviewDate: parseAppDateTime(newMockDate).toISOString(),
        }
      );
      toast.success(`Mock interview scheduled for ${formatDate(data.interviewDate)}`);
      setNewMockDate("");
      setShowNextMockForm(false);
      setActiveRoundId(data.roundId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add mock date"));
    } finally {
      setAddingMockDate(false);
    }
  };

  const submitMockScore = async () => {
    if (!currentUserId || !selected?.session) return;
    setSubmittingScore(true);
    try {
      await apiPost("/api/mock-interviews", {
        sessionId: selected.session._id,
        intervieweeId: selectedId,
        groupId,
        score: mockScore,
        weaknesses: mockWeaknesses.split(",").map((s) => s.trim()).filter(Boolean),
        strengths: [],
      });
      toast.success("Your score has been submitted");
      setShowLogModal(false);
      setMockWeaknesses("");
      setMockScore(70);
      await load(schedule?.activeRoundId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit score"));
    } finally {
      setSubmittingScore(false);
    }
  };

  if (loading && !schedule) return <LoadingState message="Loading mock interviews…" />;
  if (error && !schedule) return <ErrorState message={error} onRetry={() => load()} />;
  if (!schedule) return <ErrorState message="Schedule not found" onRetry={() => load()} />;

  const completedCount = schedule.members.filter((m) => m.status === "completed").length;
  const currentRoundHasDate = Boolean(activeRound?.interviewDate);
  const isMockToday = schedule.canGenerate;

  return (
    <div className="space-y-6">
      <Card className="!p-4">
        <CardHeader
          title="Mock Interviews"
          subtitle={
            viewMode === "history"
              ? "Review past mocks — questions asked and scores"
              : "Set the upcoming mock date, generate questions, and score teammates"
          }
        />

        <ViewModeTabs
          mode={viewMode}
          onChange={switchViewMode}
          historyCount={pastRounds.length}
        />

        {viewMode === "history" ? (
          pastRounds.length === 0 ? (
            <p className="mb-4 text-sm text-[var(--muted)]">
              No past mocks yet. After you finish a round, schedule the next one to move it here.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {pastRounds.map((round) => (
                  <Chip
                    key={round._id}
                    variant="brand"
                    active={schedule.activeRoundId === round._id}
                    onClick={() => setActiveRoundId(round._id)}
                    className="!px-3 !py-1.5 !text-sm"
                  >
                    {roundTabLabel(round)}
                  </Chip>
                ))}
              </div>
              {activeRound && (
                <p className="mb-3 text-xs text-[var(--muted)]">
                  Past mock ·{" "}
                  {activeRound.interviewDate
                    ? formatDateTime(activeRound.interviewDate)
                    : "No date recorded"}{" "}
                  · {completedCount}/{schedule.members.length} completed
                </p>
              )}
            </>
          )
        ) : (
          <>
            {activeRound && (
              <p className="mb-3 text-xs text-[var(--muted)]">
                Upcoming mock ·{" "}
                {activeRound.interviewDate
                  ? formatDateTime(activeRound.interviewDate)
                  : "No date set yet"}{" "}
                · {completedCount}/{schedule.members.length} completed
              </p>
            )}

            {canManageGroup && (
              <div className="mb-4 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--muted)]">
                      Upcoming mock date
                    </label>
                    <input
                      type="datetime-local"
                      value={mockDate}
                      onChange={(e) => setMockDate(e.target.value)}
                      className={`mt-1 block ${dateTimeInputClass}`}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void saveMockDate()}
                    disabled={savingMockDate || !mockDate}
                  >
                    {savingMockDate ? "Saving…" : "Save date"}
                  </Button>
                </div>

                {currentRoundHasDate && !showNextMockForm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNextMockForm(true)}
                  >
                    Schedule next mock →
                  </Button>
                )}

                {currentRoundHasDate && showNextMockForm && (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                    <p className="mb-2 text-xs text-[var(--muted)]">
                      Finished this round? Pick a date for the next mock — the current one moves to
                      History.
                    </p>
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="text-xs font-medium text-[var(--muted)]">
                          Next mock date
                        </label>
                        <input
                          type="datetime-local"
                          value={newMockDate}
                          onChange={(e) => setNewMockDate(e.target.value)}
                          className={`mt-1 block ${dateTimeInputClass}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void addMockDate()}
                          disabled={addingMockDate || !newMockDate}
                        >
                          {addingMockDate ? "Adding…" : "Add mock date"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowNextMockForm(false);
                            setNewMockDate("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(viewMode === "schedule" || pastRounds.length > 0) && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="pb-2">Member</th>
                <th className="pb-2">{isHistory ? "Interview" : "Next interview"}</th>
                <th className="pb-2">Done Qs</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Mock Qs</th>
                <th className="pb-2">Scores</th>
                <th className="pb-2">Avg</th>
              </tr>
            </thead>
            <tbody>
              {schedule.members.map((member) => {
                const interviewAt = memberInterviewDate(member, activeRound?.interviewDate);
                return (
                <tr
                  key={member.userId}
                  className={`table-row cursor-pointer transition-colors ${
                    selectedId === member.userId ? "bg-brand/5" : "hover:bg-[var(--surface-muted)]"
                  }`}
                  onClick={() => setSelectedId(member.userId)}
                >
                  <td className="py-2.5 font-medium">
                    <Link
                      href={`/users/${member.userId}`}
                      className="text-brand hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {member.name}
                      {member.userId === currentUserId ? " (you)" : ""}
                    </Link>
                  </td>
                  <td className="py-2.5 text-[var(--muted)]">
                    {interviewAt ? formatDateTime(interviewAt) : "Not set"}
                  </td>
                  <td className="py-2.5 font-medium text-[var(--foreground)]">
                    {member.questionsDone}
                  </td>
                  <td className="py-2.5">
                    <Chip variant={STATUS_VARIANT[member.status]} className="!text-xs">
                      {STATUS_LABEL[member.status]}
                    </Chip>
                  </td>
                  <td className="py-2.5 text-[var(--muted)]">
                    {member.questionCount > 0 ? member.questionCount : "—"}
                  </td>
                  <td className="py-2.5 text-[var(--muted)]">
                    {member.session ? `${member.scoresSubmitted}/${member.scoresExpected}` : "—"}
                  </td>
                  <td className="py-2.5 font-semibold text-brand">
                    {member.averageScore !== null ? `${member.averageScore}/100` : "—"}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {selected ? (
        <Card>
          <CardHeader
            title={`${selected.name} — ${roundTabLabel(activeRound ?? { _id: "", roundNumber: 0, interviewDate: null, isCurrent: false })}`}
            subtitle={
              selected.session
                ? `Questions generated ${formatDate(selected.session.createdAt)}`
                : memberInterviewDate(selected, activeRound?.interviewDate)
                  ? `Interview ${formatDateTime(memberInterviewDate(selected, activeRound?.interviewDate)!)}`
                  : "No interview date set"
            }
          />
          <div className="space-y-4">
            {!isHistory && (
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Interview date</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className={dateTimeInputClass}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void saveInterviewDate()}
                      disabled={savingSchedule}
                    >
                      {savingSchedule ? "Saving…" : "Save"}
                    </Button>
                    {selected.scheduledAt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void saveInterviewDate(null)}
                        disabled={savingSchedule}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-[var(--muted)]">
              <strong className="text-[var(--foreground)]">{selected.questionsDone}</strong>{" "}
              questions marked done{isHistory ? " by this date" : " till now"}.
              {!isHistory && " Mock questions are picked from this pool."}
            </p>

            {canGenerate ? (
              <Button variant="outline" size="sm" onClick={generateQuestions} disabled={generating}>
                {generating ? "Picking questions…" : "Generate from Done Questions"}
              </Button>
            ) : null}

            {!isHistory && !isMockToday && activeRound?.interviewDate && !selected.session && !isSelf ? (
              <p className="text-sm text-[var(--muted)]">
                Questions can be generated on {formatDate(activeRound.interviewDate)}.
              </p>
            ) : null}

            {isSelf && !selected.session && !isHistory ? (
              <p className="text-sm text-[var(--muted)]">
                A teammate will generate your mock questions from your done questions.
              </p>
            ) : null}

            {selected.session ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Mock questions</p>
                  {selected.session.questions.map((q) => (
                    <div
                      key={`${q.subjectId}-${q.questionId ?? q.question}`}
                      className="inset-panel p-3"
                    >
                      <p className="text-xs font-semibold uppercase text-brand">{q.subjectName}</p>
                      <p className="mt-1 text-sm font-medium">{q.question}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-medium">Scores</p>
                  <div className="mt-2 space-y-1.5">
                    {selected.session.expectedScorers.map((scorerId) => {
                      const scorer = schedule.members.find((m) => m.userId === scorerId);
                      const submitted = selected.session!.scores.find(
                        (s) => s.interviewerId === scorerId
                      );
                      return (
                        <div
                          key={scorerId}
                          className="flex items-center justify-between rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm"
                        >
                          <span>{scorer?.name ?? "Member"}</span>
                          {submitted ? (
                            <span className="font-medium text-emerald-600">
                              {submitted.score}/100
                            </span>
                          ) : (
                            <span className="text-[var(--muted)]">Pending</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {canScore ? (
                  <Button size="sm" onClick={() => setShowLogModal(true)}>
                    Submit My Score
                  </Button>
                ) : null}
                {selected.session.currentUserHasScored ? (
                  <p className="text-sm text-emerald-600">You have submitted your score.</p>
                ) : null}
              </>
            ) : isHistory ? (
              <p className="text-sm text-[var(--muted)]">
                {selected.status === "not_started"
                  ? "No mock was held on this date."
                  : "Select another member or date for more detail."}
              </p>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="!p-4">
          <p className="text-sm text-[var(--muted)]">
            {viewMode === "history"
              ? "Select a member to view their mock questions and scores."
              : "Select a member to set their interview time, generate questions, or submit scores."}
          </p>
        </Card>
      )}

      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title="Submit Mock Score">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Score {selected?.name}&apos;s mock. One score per member.
          </p>
          <div>
            <label className="text-sm font-medium">Score (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={mockScore}
              onChange={(e) => setMockScore(Number(e.target.value))}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Weak areas (comma separated)</label>
            <input
              type="text"
              value={mockWeaknesses}
              onChange={(e) => setMockWeaknesses(e.target.value)}
              placeholder="Multithreading, SQL joins"
              className="input mt-1"
            />
          </div>
          <Button onClick={submitMockScore} className="w-full" disabled={submittingScore}>
            {submittingScore ? "Submitting…" : "Submit Score"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
