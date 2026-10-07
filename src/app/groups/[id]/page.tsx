"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/providers/UserProvider";
import { apiGet, apiPatch, apiPost, apiDelete, getErrorMessage } from "@/lib/api";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import InviteCodeBlock from "@/components/groups/InviteCodeBlock";
import GroupGamificationPanel from "@/components/groups/GroupGamificationPanel";
import QuestionListView from "@/components/questions/QuestionListView";
import {
  formatSubjectTrack,
  isGroupFull,
  JOIN_CODE_TTL_MINUTES,
  MAX_GROUP_MEMBERS,
  normalizeQuestionStatus,
  toDateInputValue,
} from "@/lib/utils";
import toast from "react-hot-toast";
import {
  triggerQuestionPointsBurst,
  type QuestionPointBurst,
} from "@/lib/question-points-burst";
import type {
  Group,
  GroupGamification,
  MemberStat,
  PracticeQuestion,
  QuestionStatus,
  Subject,
} from "@/types";

type GroupQuestion = PracticeQuestion & { subjectName: string; trackLabel?: string };

type GroupDetail = Group & {
  memberStats: (MemberStat & { role: string })[];
  gamification: GroupGamification;
  topicCount: number;
  countdown: { days: number; hours: number; interviewDate: string };
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user, refreshUser } = useUser();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupQuestions, setGroupQuestions] = useState<GroupQuestion[]>([]);
  const [pointBurst, setPointBurst] = useState<QuestionPointBurst | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [practiceDate, setPracticeDate] = useState(toDateInputValue());
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, questionData, subjectData] = await Promise.all([
        apiGet<GroupDetail>(`/api/groups/${groupId}`),
        apiGet<GroupQuestion[]>(`/api/practice-questions?groupId=${groupId}&scope=group`),
        apiGet<Subject[]>(`/api/subjects?groupId=${groupId}&scope=group`),
      ]);
      setGroup(data);
      setGroupQuestions(questionData);
      setSubjects(subjectData);
      if (!newSubjectId && subjectData.length > 0) {
        setNewSubjectId(subjectData[0]._id);
      }
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load group"));
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => { load(); }, [load]);

  const updateQuestionStatus = async (id: string, status: QuestionStatus) => {
    const normalized = normalizeQuestionStatus(status);
    let previousStatus: QuestionStatus | undefined;
    setGroupQuestions((prev) => {
      const current = prev.find((q) => q._id === id);
      if (!current) return prev;
      previousStatus = current.status;
      return prev.map((q) => (q._id === id ? { ...q, status: normalized } : q));
    });
    if (!previousStatus) return;

    try {
      const updated = await apiPatch<{ pointsEarnedNow?: number }>(
        `/api/practice-questions/${id}`,
        { status: normalized }
      );
      triggerQuestionPointsBurst(setPointBurst, id, updated.pointsEarnedNow);
      if (normalized === "add_to_todo") {
        toast.success("Added to Tasks");
      }
    } catch (err) {
      setGroupQuestions((prev) =>
        prev.map((q) => (q._id === id ? { ...q, status: previousStatus! } : q))
      );
      toast.error(getErrorMessage(err, "Failed to update question"));
    }
  };

  const addGroupQuestion = async () => {
    if (!user || !newQuestion.trim() || !newSubjectId) return;
    try {
      await apiPost("/api/practice-questions", {
        groupId,
        subjectId: newSubjectId,
        content: newQuestion,
        scope: "group",
        practiceDate,
      });
      toast.success("Question added for everyone");
      setShowQuestionModal(false);
      setNewQuestion("");
      setPracticeDate(toDateInputValue());
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add question"));
    }
  };

  const generateInviteCode = useCallback(async () => {
    setInviteLoading(true);
    try {
      const res = await apiPost<{ joinCode: string; joinCodeExpiresAt: string }>(
        `/api/groups/${groupId}/regenerate-code`
      );
      setGroup((prev) =>
        prev
          ? { ...prev, joinCode: res.joinCode, joinCodeExpiresAt: res.joinCodeExpiresAt }
          : prev
      );
      toast.success("Invite code ready to share");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to generate invite code"));
    } finally {
      setInviteLoading(false);
    }
  }, [groupId]);

  const myRole = group?.members.find((m) => String(m.userId) === user?._id)?.role;
  const isOwner = myRole === "owner";
  const canEditGroup = myRole === "owner" || myRole === "admin";

  const openEditModal = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDescription(group.description ?? "");
    setShowEditModal(true);
  };

  const saveGroup = async () => {
    if (!editName.trim()) return;
    setSavingGroup(true);
    try {
      const updated = await apiPatch<Group>(`/api/groups/${groupId}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setGroup((prev) => (prev ? { ...prev, ...updated } : prev));
      setShowEditModal(false);
      toast.success("Group updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update group"));
    } finally {
      setSavingGroup(false);
    }
  };

  const deleteGroup = async () => {
    setDeletingGroup(true);
    try {
      await apiDelete(`/api/groups/${groupId}`);
      await refreshUser();
      toast.success("Group deleted");
      router.push("/groups");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete group"));
    } finally {
      setDeletingGroup(false);
      setShowDeleteModal(false);
    }
  };

  const removeMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    try {
      await apiDelete(`/api/groups/${groupId}/members/${memberId}`);
      if (memberId === user?._id) {
        await refreshUser();
        toast.success("You left the group");
        router.push("/groups");
        return;
      }
      toast.success("Member removed");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove member"));
    } finally {
      setRemovingMemberId(null);
    }
  };

  const transferOwnership = async () => {
    if (!transferTargetId) return;
    setTransferring(true);
    try {
      await apiPost(`/api/groups/${groupId}/transfer-ownership`, {
        newOwnerId: transferTargetId,
      });
      toast.success("Ownership transferred");
      setShowTransferModal(false);
      setTransferTargetId("");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to transfer ownership"));
    } finally {
      setTransferring(false);
    }
  };

  const otherMembers = group?.memberStats.filter(
    (m) => m.userId !== user?._id && m.role !== "owner"
  ) ?? [];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!group) return <ErrorState message="Group not found" onRetry={load} />;

  return (
    <div className="space-y-6">
      {canEditGroup && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={openEditModal}>
            Edit Group
          </Button>
          {isOwner && otherMembers.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowTransferModal(true)}>
              Transfer Ownership
            </Button>
          )}
          {isOwner && (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              Delete Group
            </Button>
          )}
        </div>
      )}

      {group.gamification && <GroupGamificationPanel gamification={group.gamification} />}

      <Card className="!p-4">
        <CardHeader
          title={`Members (${group.memberStats.length}/${MAX_GROUP_MEMBERS})`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="pb-2">Member</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Points</th>
                <th className="pb-2">Tasks</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {group.memberStats.map((m) => {
                const points =
                  group.gamification?.leaderboard.find((g) => g.userId === m.userId)?.totalPoints ?? 0;
                const isMe = m.userId === user?._id;
                const canRemove =
                  m.role !== "owner" &&
                  (isMe || isOwner);
                return (
                  <tr key={m.userId} className="table-row">
                    <td className="py-2.5 font-medium">
                      <Link href={`/users/${m.userId}`} className="text-brand hover:underline">
                        {m.name}
                        {isMe ? " (you)" : ""}
                      </Link>
                    </td>
                    <td className="py-2.5 capitalize text-[var(--muted)]">{m.role}</td>
                    <td className="py-2.5 font-semibold text-brand">{points}</td>
                    <td className="py-2.5">{m.tasksCompleted}</td>
                    <td className="py-2.5 text-right">
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removingMemberId === m.userId}
                          onClick={() => removeMember(m.userId)}
                        >
                          {removingMemberId === m.userId
                            ? "…"
                            : isMe
                              ? "Leave"
                              : "Remove"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Group Questions"
          subtitle="Shared with everyone — each member tracks their own progress"
          action={
            <div className="flex gap-2">
              <Link href="/questions">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
              <Button size="sm" onClick={() => setShowQuestionModal(true)} disabled={subjects.length === 0}>
                Add Question
              </Button>
            </div>
          }
        />
        {groupQuestions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No group questions yet. Add questions everyone should practice together.
          </p>
        ) : (
          <QuestionListView
            pointBurst={pointBurst}
            questions={groupQuestions.map((q) => ({ ...q, scope: "group" as const }))}
            onStatusChange={updateQuestionStatus}
          />
        )}
      </Card>

      <Card>
        <CardHeader title="Invite Members" />
        {isOwner ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              Generate a short-lived invite code when you are ready to add someone. Codes expire after{" "}
              {JOIN_CODE_TTL_MINUTES} minutes.
            </p>
            {isGroupFull(group.memberStats.length) ? (
              <p className="text-sm text-[var(--muted)]">
                Group is full ({MAX_GROUP_MEMBERS}/{MAX_GROUP_MEMBERS} members).
              </p>
            ) : (
              <InviteCodeBlock
                joinCode={group.joinCode}
                joinCodeExpiresAt={group.joinCodeExpiresAt}
                onGenerate={generateInviteCode}
                generating={inviteLoading}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Ask the group owner for a fresh invite code when you want to add a teammate.
          </p>
        )}
      </Card>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Group">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This permanently deletes <strong>{group.name}</strong> and all its questions, subjects,
            and progress data. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={deletingGroup}
              onClick={deleteGroup}
            >
              {deletingGroup ? "Deleting…" : "Delete Group"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Ownership"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Choose a member to become the new owner. You will become a regular member.
          </p>
          <select
            value={transferTargetId}
            onChange={(e) => setTransferTargetId(e.target.value)}
            className="w-full rounded-lg border border-[var(--input-border)] px-4 py-2 text-sm dark:bg-[var(--input-bg)]"
          >
            <option value="">Select member…</option>
            {otherMembers.map((m) => (
              <option key={m.userId} value={m.userId}>{m.name}</option>
            ))}
          </select>
          <Button
            className="w-full"
            disabled={!transferTargetId || transferring}
            onClick={transferOwnership}
          >
            {transferring ? "Transferring…" : "Transfer Ownership"}
          </Button>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Group">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Group name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-4 py-2 text-sm dark:bg-[var(--input-bg)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-4 py-2 text-sm dark:bg-[var(--input-bg)]"
            />
          </div>
          <Button onClick={saveGroup} className="w-full" disabled={savingGroup || !editName.trim()}>
            {savingGroup ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </Modal>

      <Modal open={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Add Group Question">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Assigned to every group member. Each person marks their own progress.
          </p>
          <div>
            <label className="text-sm font-medium">Practice date</label>
            <input
              type="date"
              value={practiceDate}
              onChange={(e) => setPracticeDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-4 py-2 text-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Track</label>
            <select
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-4 py-2 text-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)]"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{formatSubjectTrack(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Question</label>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-4 py-2 text-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)]"
            />
          </div>
          <Button onClick={addGroupQuestion} className="w-full" disabled={!newQuestion.trim() || !newSubjectId}>
            Add for Everyone
          </Button>
        </div>
      </Modal>
    </div>
  );
}
