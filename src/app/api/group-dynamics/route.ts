import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError, istDateKey } from "@/lib/utils";
import { isGroupMember, getGroupInsights } from "@/lib/services";
import { canManageGroup } from "@/lib/group-roles";
import { findBehind, type MemberActivity } from "@/lib/group-dynamics";
import {
  buildMomentum,
  memberStatus,
  momentumHeadline,
  nextMilestone,
  type ActivityEvent,
  type MomentumResponse,
} from "@/lib/group-momentum";
import { NOTE_COOLDOWN_MS, WEEKLY_GOAL_PER_MEMBER } from "@/lib/group-notes";
import Group from "@/models/Group";
import Subject from "@/models/Subject";
import PracticeQuestion from "@/models/PracticeQuestion";
import QuestionProgress from "@/models/QuestionProgress";
import StudySession from "@/models/StudySession";
import GroupNote from "@/models/GroupNote";
import User from "@/models/User";

const DAY = 86_400_000;
// Enough history for the streak and the weekly view.
const LOOKBACK_DAYS = 60;

/**
 * Group momentum: team streak, weekly goal, per-member activity and highlights.
 * Everyone sees activity (their dashboard already shows teammates' readiness).
 * Who is "behind" is only shown to admins.
 */
export const GET = withAuth(async (request, { userId }) => {
  const groupId = new URL(request.url).searchParams.get("groupId");
  if (!groupId) return jsonError("groupId is required");

  const group = await Group.findById(groupId).select("members").lean();
  const role = group ? isGroupMember(group, userId) : null;
  if (!group || !role) return jsonError("Not a member of this group", 403);

  const now = new Date();
  const since = new Date(now.getTime() - LOOKBACK_DAYS * DAY);
  const memberIds = group.members.map((m) => String(m.userId));

  const [subjects, questions, users, insights, sessions, notesWeek, sentByMe, unreadNotes] = await Promise.all([
    Subject.find({ groupId, scope: "group", isActive: true }).select("_id name").lean(),
    PracticeQuestion.find({ groupId, scope: "group" }).select("_id subjectId").lean(),
    User.find({ _id: { $in: memberIds } }).select("_id name studyStreak").lean(),
    getGroupInsights(groupId, memberIds),
    StudySession.find({ groupId, userId: { $in: memberIds }, completedAt: { $gte: since } })
      .select("userId completedAt durationMinutes")
      .lean(),
    GroupNote.find({ groupId, kind: "cheer", createdAt: { $gte: new Date(now.getTime() - 7 * DAY) } })
      .select("toUserId")
      .lean(),
    GroupNote.find({ groupId, fromUserId: userId, createdAt: { $gte: new Date(now.getTime() - NOTE_COOLDOWN_MS) } })
      .select("toUserId kind")
      .lean(),
    GroupNote.countDocuments({ groupId, toUserId: userId, readAt: { $exists: false } }),
  ]);

  const progress = await QuestionProgress.find({
    userId: { $in: memberIds },
    questionId: { $in: questions.map((q) => q._id) },
    status: { $in: ["done", "revised"] },
  })
    .select("userId questionId lastPracticed updatedAt")
    .lean();

  const events: ActivityEvent[] = [];
  for (const p of progress) {
    const at = new Date(p.lastPracticed ?? p.updatedAt);
    if (at >= since) events.push({ userId: String(p.userId), at, kind: "question" });
  }
  for (const s of sessions) {
    events.push({ userId: String(s.userId), at: new Date(s.completedAt), kind: "study", minutes: s.durationMinutes });
  }
  const momentum = buildMomentum({ memberIds, events, now, dayKey: istDateKey });

  // Per-subject completion, used to flag members who are behind.
  const subjectOf = new Map(questions.map((q) => [String(q._id), String(q.subjectId)]));
  const subjectName = new Map(subjects.map((s) => [String(s._id), s.name]));
  const totalBySubject = new Map<string, number>();
  for (const q of questions) totalBySubject.set(String(q.subjectId), (totalBySubject.get(String(q.subjectId)) ?? 0) + 1);
  const doneBySubject = new Map<string, Map<string, number>>();
  const doneCount = new Map<string, number>();
  for (const p of progress) {
    const uid = String(p.userId);
    const sid = subjectOf.get(String(p.questionId));
    doneCount.set(uid, (doneCount.get(uid) ?? 0) + 1);
    if (!sid) continue;
    if (!doneBySubject.has(uid)) doneBySubject.set(uid, new Map());
    doneBySubject.get(uid)!.set(sid, (doneBySubject.get(uid)!.get(sid) ?? 0) + 1);
  }

  const names = new Map(users.map((u) => [String(u._id), u.name]));
  const streaks = new Map(users.map((u) => [String(u._id), u.studyStreak ?? 0]));
  const readiness = new Map(insights.memberStats.map((m) => [m.userId, m.readiness]));

  const activity: MemberActivity[] = memberIds.map((id) => {
    const bySubject: Record<string, number> = {};
    for (const [sid, total] of totalBySubject) {
      const name = subjectName.get(sid);
      if (name) bySubject[name] = Math.round((((doneBySubject.get(id)?.get(sid)) ?? 0) / total) * 100);
    }
    const m = momentum.members[id];
    return {
      userId: id,
      name: names.get(id) ?? "Member",
      bySubject,
      donePercent: questions.length ? Math.round(((doneCount.get(id) ?? 0) / questions.length) * 100) : 0,
      doneLast7Days: m.doneWeek,
      daysSinceActive: m.daysSinceActive,
    };
  });

  const isAdmin = canManageGroup(role);
  const behind = isAdmin ? new Map(findBehind(activity).map((b) => [b.userId, b.reasons])) : new Map<string, string[]>();
  const cheers = new Map<string, number>();
  for (const n of notesWeek) cheers.set(String(n.toUserId), (cheers.get(String(n.toUserId)) ?? 0) + 1);
  const sent = new Map<string, string[]>();
  for (const n of sentByMe) sent.set(String(n.toUserId), [...(sent.get(String(n.toUserId)) ?? []), n.kind]);

  const members: MomentumResponse["members"] = memberIds
    .map((id) => {
      const m = momentum.members[id];
      const gm = group.members.find((x) => String(x.userId) === id);
      return {
        userId: id,
        name: names.get(id) ?? "Member",
        role: gm?.role ?? "member",
        isSelf: id === userId,
        readiness: readiness.get(id) ?? 0,
        studyStreak: streaks.get(id) ?? 0,
        questionsDone: doneCount.get(id) ?? 0,
        donePercent: questions.length ? Math.round(((doneCount.get(id) ?? 0) / questions.length) * 100) : 0,
        dots: m.dots,
        activeDays: m.activeDays,
        doneWeek: m.doneWeek,
        minutesWeek: m.minutesWeek,
        daysSinceActive: m.daysSinceActive,
        status: memberStatus(m.daysSinceActive),
        cheersWeek: cheers.get(id) ?? 0,
        sentToday: sent.get(id) ?? [],
        behindReasons: behind.get(id) ?? [],
      };
    })
    .sort((a, b) => Number(b.isSelf) - Number(a.isSelf) || b.doneWeek - a.doneWeek || a.name.localeCompare(b.name));

  const goal = memberIds.length * WEEKLY_GOAL_PER_MEMBER;
  const goalPct = goal ? Math.round((momentum.doneWeek / goal) * 100) : 0;
  const nameOf = (id: string) => names.get(id) ?? "Member";
  const highlight = (h: { userId: string; value: number } | null) => (h ? { ...h, name: nameOf(h.userId) } : null);

  const totalDone = progress.length;

  const response: MomentumResponse = {
    isAdmin,
    unreadNotes,
    headline: momentumHeadline({
      streak: momentum.streak,
      activeMembers: momentum.activeMembers,
      memberCount: memberIds.length,
      goalPct,
    }),
    team: {
      memberCount: memberIds.length,
      activeMembers: momentum.activeMembers,
      doneWeek: momentum.doneWeek,
      goal,
      minutesWeek: momentum.minutesWeek,
      streak: momentum.streak,
      totalQuestions: questions.length,
      totalDone,
      milestone: nextMilestone(totalDone),
      days: momentum.days,
    },
    highlights: {
      topSolver: highlight(momentum.highlights.topSolver),
      mostConsistent: highlight(momentum.highlights.mostConsistent),
      mostFocused: highlight(momentum.highlights.mostFocused),
    },
    members,
  };
  return jsonOk(response);
}, "Failed to load group momentum");
