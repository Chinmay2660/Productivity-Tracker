import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { isGroupMember } from "@/lib/services";
import { canManageGroup } from "@/lib/group-roles";
import { findBehind, suggestPairings, type MemberActivity } from "@/lib/group-dynamics";
import Group from "@/models/Group";
import Subject from "@/models/Subject";
import PracticeQuestion from "@/models/PracticeQuestion";
import QuestionProgress from "@/models/QuestionProgress";
import User from "@/models/User";

const DAY = 86_400_000;

/**
 * Admins see who's falling behind. Everyone sees suggested study partners for themselves.
 * Peer pairings are limited to the caller so members aren't publicly ranked.
 */
export const GET = withAuth(async (request, { userId }) => {
  const groupId = new URL(request.url).searchParams.get("groupId");
  if (!groupId) return jsonError("groupId is required");

  const group = await Group.findById(groupId).select("members").lean();
  const role = group ? isGroupMember(group, userId) : null;
  if (!group || !role) return jsonError("Not a member of this group", 403);

  const memberIds = group.members.map((m) => String(m.userId));
  const [subjects, questions, users] = await Promise.all([
    Subject.find({ groupId, scope: "group", isActive: true }).select("_id name").lean(),
    PracticeQuestion.find({ groupId, scope: "group" }).select("_id subjectId").lean(),
    User.find({ _id: { $in: memberIds } }).select("_id name").lean(),
  ]);
  const progress = await QuestionProgress.find({
    userId: { $in: memberIds },
    questionId: { $in: questions.map((q) => q._id) },
    status: { $in: ["done", "revised"] },
  })
    .select("userId questionId lastPracticed updatedAt")
    .lean();

  const subjectOf = new Map(questions.map((q) => [String(q._id), String(q.subjectId)]));
  const subjectName = new Map(subjects.map((s) => [String(s._id), s.name]));
  const totalBySubject = new Map<string, number>();
  for (const q of questions) {
    const k = String(q.subjectId);
    totalBySubject.set(k, (totalBySubject.get(k) ?? 0) + 1);
  }
  const names = new Map(users.map((u) => [String(u._id), u.name]));
  const now = Date.now();

  const members: MemberActivity[] = memberIds.map((id) => {
    const mine = progress.filter((p) => String(p.userId) === id);
    const doneBySubject = new Map<string, number>();
    let last = 0;
    let last7 = 0;
    for (const p of mine) {
      const sid = subjectOf.get(String(p.questionId));
      if (sid) doneBySubject.set(sid, (doneBySubject.get(sid) ?? 0) + 1);
      const at = new Date(p.lastPracticed ?? p.updatedAt).getTime();
      if (at > last) last = at;
      if (now - at <= 7 * DAY) last7 += 1;
    }
    const bySubject: Record<string, number> = {};
    for (const [sid, total] of totalBySubject) {
      const name = subjectName.get(sid);
      if (name) bySubject[name] = Math.round(((doneBySubject.get(sid) ?? 0) / total) * 100);
    }
    return {
      userId: id,
      name: names.get(id) ?? "Member",
      bySubject,
      donePercent: questions.length ? Math.round((mine.length / questions.length) * 100) : 0,
      doneLast7Days: last7,
      daysSinceActive: last ? Math.floor((now - last) / DAY) : null,
    };
  });

  const isAdmin = canManageGroup(role);
  const myPairing = suggestPairings(members).find((p) => p.learnerId === userId);
  const partner = myPairing
    ? {
        subject: myPairing.subject,
        partnerName: names.get(myPairing.mentorId) ?? "A teammate",
        gap: myPairing.gap,
      }
    : null;

  return jsonOk({
    isAdmin,
    partner,
    behind: isAdmin ? findBehind(members) : [],
    groupDonePercent: members.length
      ? Math.round(members.reduce((s, m) => s + m.donePercent, 0) / members.length)
      : 0,
    weeklyActive: members.filter((m) => m.doneLast7Days > 0).length,
    memberCount: members.length,
  });
}, "Failed to load group dynamics");
