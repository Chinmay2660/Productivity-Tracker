import mongoose from "mongoose";
import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc, isGroupMember } from "@/lib/services";
import { listMockRounds, getCurrentRound } from "@/lib/mock-rounds";
import MockInterviewSession from "@/models/MockInterviewSession";
import MockInterview from "@/models/MockInterview";
import Group from "@/models/Group";
import User from "@/models/User";

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const intervieweeId = searchParams.get("intervieweeId");
  const groupId = searchParams.get("groupId");
  const roundIdParam = searchParams.get("roundId");

  if (!intervieweeId || !groupId) {
    return jsonError("intervieweeId and groupId are required");
  }

  const group = await Group.findById(groupId).lean();
  if (!group) return jsonError("Group not found", 404);
  if (!isGroupMember(group, userId)) return jsonError("Unauthorized", 403);
  if (!group.members.some((m) => String(m.userId) === intervieweeId)) {
    return jsonError("Interviewee is not a group member", 400);
  }

  const rounds = await listMockRounds(groupId);
  const currentRound = getCurrentRound(rounds);
  const roundId =
    roundIdParam ??
    (currentRound ? String(currentRound._id) : null);

  if (!roundId) {
    return jsonOk({ session: null });
  }

  const session = await MockInterviewSession.findOne({
    groupId: new mongoose.Types.ObjectId(groupId),
    roundId: new mongoose.Types.ObjectId(roundId),
    intervieweeId: new mongoose.Types.ObjectId(intervieweeId),
  }).lean();

  if (!session) {
    return jsonOk({ session: null });
  }

  const scores = await MockInterview.find({ sessionId: session._id }).lean();
  const scorerIds = scores.map((s) => s.interviewerId).filter(Boolean);
  const scorers = scorerIds.length
    ? await User.find({ _id: { $in: scorerIds } }).lean()
    : [];
  const scorerMap = new Map(scorers.map((u) => [String(u._id), u.name]));

  const expectedScorers = group.members
    .filter((m) => String(m.userId) !== intervieweeId)
    .map((m) => String(m.userId));

  return jsonOk({
    session: {
      ...serializeDoc(session),
      questions: session.questions.map((q) => ({
        subjectId: String(q.subjectId),
        subjectName: q.subjectName,
        topicId: q.topicId ? String(q.topicId) : undefined,
        questionId: String(q.questionId),
        question: q.question,
        source: q.source,
      })),
      scores: scores.map((s) => ({
        interviewerId: s.interviewerId ? String(s.interviewerId) : undefined,
        interviewerName: s.interviewerId
          ? scorerMap.get(String(s.interviewerId)) ?? s.interviewer
          : s.interviewer,
        score: s.score,
        weaknesses: s.weaknesses,
      })),
      expectedScorers,
      currentUserHasScored: scores.some((s) => String(s.interviewerId) === userId),
    },
  });
}, "Failed to fetch mock session");
