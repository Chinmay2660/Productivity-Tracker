import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError, parseAppDateTime } from "@/lib/utils";
import { serializeDoc, isGroupMember, canManageGroup } from "@/lib/services";
import {
  listMockRounds,
  getCurrentRound,
  countQuestionsDoneTill,
  roundInterviewDates,
  createNextMockRound,
  isOnMockInterviewDate,
  upsertMockInterviewSlot,
  mockObjectIds,
} from "@/lib/mock-rounds";
import MockInterviewRound from "@/models/MockInterviewRound";
import MockInterviewSession from "@/models/MockInterviewSession";
import MockInterview from "@/models/MockInterview";
import MockInterviewSlot from "@/models/MockInterviewSlot";
import Group from "@/models/Group";
import User from "@/models/User";

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const roundIdParam = searchParams.get("roundId");

  if (!groupId) return jsonError("groupId is required");

  const group = await Group.findById(groupId).lean();
  if (!group) return jsonError("Group not found", 404);
  if (!isGroupMember(group, userId)) return jsonError("Unauthorized", 403);

  const rounds = await listMockRounds(groupId);
  const currentRound = getCurrentRound(rounds);
  const activeRound =
    (roundIdParam ? rounds.find((r) => String(r._id) === roundIdParam) : null) ?? currentRound;

  if (!activeRound) return jsonError("No mock interview round found", 404);

  const interviewDates = await roundInterviewDates(groupId, rounds);
  const activeRoundDate = interviewDates.get(String(activeRound._id)) ?? null;
  const isViewingHistory = currentRound
    ? String(activeRound._id) !== String(currentRound._id)
    : false;

  const memberIds = group.members.map((m) => String(m.userId));
  const users = await User.find({ _id: { $in: memberIds } }).lean();
  const userMap = new Map(users.map((u) => [String(u._id), u.name]));

  const [sessions, slots] = await Promise.all([
    MockInterviewSession.find({ groupId, roundId: activeRound._id }).lean(),
    MockInterviewSlot.find({ groupId, roundId: activeRound._id }).lean(),
  ]);
  const sessionIds = sessions.map((s) => s._id);
  const scores = sessionIds.length
    ? await MockInterview.find({ sessionId: { $in: sessionIds } }).lean()
    : [];

  const scoresBySession = new Map<string, typeof scores>();
  for (const score of scores) {
    const key = String(score.sessionId);
    const list = scoresBySession.get(key) ?? [];
    list.push(score);
    scoresBySession.set(key, list);
  }

  const sessionByInterviewee = new Map(
    sessions.map((s) => [String(s.intervieweeId), s])
  );
  const slotByInterviewee = new Map(
    slots.map((s) => [String(s.intervieweeId), s])
  );

  const members = await Promise.all(
    memberIds.map(async (memberId) => {
      const session = sessionByInterviewee.get(memberId);
      const slot = slotByInterviewee.get(memberId);
      const expectedScorers = memberIds.filter((id) => id !== memberId);
      const sessionScores = session ? scoresBySession.get(String(session._id)) ?? [] : [];
      const averageScore =
        sessionScores.length > 0
          ? Math.round(
              sessionScores.reduce((sum, s) => sum + s.score, 0) / sessionScores.length
            )
          : null;

      let status: "not_started" | "in_progress" | "completed" = "not_started";
      if (session) {
        status =
          sessionScores.length >= expectedScorers.length ? "completed" : "in_progress";
      }

      const questionsDone = await countQuestionsDoneTill(
        memberId,
        groupId,
        isViewingHistory ? activeRoundDate ?? undefined : undefined
      );

      return {
        userId: memberId,
        name: userMap.get(memberId) ?? "Member",
        role: group.members.find((m) => String(m.userId) === memberId)?.role ?? "member",
        status,
        scheduledAt:
          slot?.scheduledAt?.toISOString() ?? activeRoundDate?.toISOString() ?? null,
        questionsDone,
        questionCount: session?.questions.length ?? 0,
        scoresSubmitted: sessionScores.length,
        scoresExpected: expectedScorers.length,
        averageScore,
        session: session
          ? {
              ...serializeDoc(session),
              questions: session.questions.map((q) => ({
                subjectId: String(q.subjectId),
                subjectName: q.subjectName,
                topicId: q.topicId ? String(q.topicId) : undefined,
                questionId: String(q.questionId),
                question: q.question,
                source: q.source,
              })),
              scores: sessionScores.map((s) => ({
                interviewerId: s.interviewerId ? String(s.interviewerId) : undefined,
                interviewerName: s.interviewerId
                  ? userMap.get(String(s.interviewerId)) ?? s.interviewer
                  : s.interviewer,
                score: s.score,
                weaknesses: s.weaknesses,
              })),
              expectedScorers,
              currentUserHasScored: sessionScores.some(
                (s) => String(s.interviewerId) === userId
              ),
            }
          : null,
      };
    })
  );

  const currentRoundDate = currentRound
    ? interviewDates.get(String(currentRound._id))
    : null;

  return jsonOk({
    groupId,
    currentRoundId: currentRound ? String(currentRound._id) : null,
    activeRoundId: String(activeRound._id),
    isViewingHistory,
    canGenerate: isOnMockInterviewDate(currentRoundDate),
    rounds: rounds.map((r) => ({
      _id: String(r._id),
      roundNumber: r.roundNumber,
      interviewDate: interviewDates.get(String(r._id))?.toISOString() ?? null,
      isCurrent: currentRound ? String(r._id) === String(currentRound._id) : false,
    })),
    members,
  });
}, "Failed to fetch mock interview schedule");

export const PATCH = withAuth(async (request, { userId }) => {
  const body = await request.json();
  const {
    action = "setInterviewDate",
    groupId,
    roundId,
    intervieweeId,
    scheduledAt,
    interviewDate,
  } = body;

  if (!groupId) return jsonError("groupId is required");

  const group = await Group.findById(groupId);
  if (!group) return jsonError("Group not found", 404);
  const role = isGroupMember(group, userId);
  if (!role) return jsonError("Unauthorized", 403);

  if (action === "addMockDate") {
    if (!canManageGroup(role)) return jsonError("Only owners/admins can add mock dates", 403);
    if (!interviewDate) return jsonError("interviewDate is required");

    const parsed = parseAppDateTime(interviewDate);
    if (Number.isNaN(parsed.getTime())) return jsonError("Invalid interviewDate");

    const round = await createNextMockRound(groupId, parsed);
    return jsonOk({
      roundId: String(round._id),
      roundNumber: round.roundNumber,
      interviewDate: parsed.toISOString(),
    });
  }

  if (!roundId) return jsonError("roundId is required");

  const rounds = await listMockRounds(groupId);
  const currentRound = getCurrentRound(rounds);
  if (!currentRound || String(currentRound._id) !== roundId) {
    return jsonError("Can only edit the upcoming mock date", 400);
  }

  if (action === "setMockDate" || action === "setAllInterviewDates") {
    if (!canManageGroup(role)) return jsonError("Only owners/admins can set all dates", 403);
    if (!scheduledAt) return jsonError("scheduledAt is required");

    const parsed = parseAppDateTime(scheduledAt);
    if (Number.isNaN(parsed.getTime())) return jsonError("Invalid scheduledAt");

    await MockInterviewRound.findByIdAndUpdate(roundId, {
      interviewDate: parsed,
      startsAt: parsed,
      endsAt: parsed,
    });

    const memberIds = group.members.map((m) => String(m.userId));
    for (const memberId of memberIds) {
      await upsertMockInterviewSlot({
        groupId,
        roundId,
        intervieweeId: memberId,
        scheduledAt: parsed,
        scheduledBy: userId,
      });
    }
    return jsonOk({ scheduledAt: parsed.toISOString(), count: memberIds.length });
  }

  if (action === "setInterviewDate") {
    if (!intervieweeId) return jsonError("intervieweeId is required");
    if (!group.members.some((m) => String(m.userId) === intervieweeId)) {
      return jsonError("Interviewee is not a group member", 400);
    }

    if (scheduledAt === null || scheduledAt === "") {
      await MockInterviewSlot.deleteOne(mockObjectIds(groupId, roundId, intervieweeId));
      return jsonOk({ intervieweeId, scheduledAt: null });
    }

    if (!scheduledAt) return jsonError("scheduledAt is required");

    const parsed = parseAppDateTime(scheduledAt);
    if (Number.isNaN(parsed.getTime())) return jsonError("Invalid scheduledAt");

    const slot = await upsertMockInterviewSlot({
      groupId,
      roundId,
      intervieweeId,
      scheduledAt: parsed,
      scheduledBy: userId,
    });

    return jsonOk({
      intervieweeId,
      scheduledAt: slot!.scheduledAt.toISOString(),
    });
  }

  return jsonError("Unknown action");
}, "Failed to update mock interview schedule");
