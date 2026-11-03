import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { isGroupMember } from "@/lib/services";
import { listMockRounds } from "@/lib/mock-rounds";
import MockInterview from "@/models/MockInterview";
import MockInterviewSession from "@/models/MockInterviewSession";
import Group from "@/models/Group";

const KEYS = ["communication", "correctness", "depth", "confidence"] as const;

/** The current user's mock results averaged per round: overall score plus each rubric dimension. */
export const GET = withAuth(async (request, { userId }) => {
  const groupId = new URL(request.url).searchParams.get("groupId");
  if (!groupId) return jsonError("groupId is required");

  const group = await Group.findById(groupId).select("members").lean();
  if (!group || !isGroupMember(group, userId)) return jsonError("Not a member of this group", 403);

  const [rounds, sessions] = await Promise.all([
    listMockRounds(groupId),
    MockInterviewSession.find({ groupId, intervieweeId: userId }).select("_id roundId").lean(),
  ]);
  const roundBySession = new Map(sessions.map((s) => [String(s._id), String(s.roundId)]));
  const results = await MockInterview.find({
    userId,
    groupId,
    sessionId: { $in: sessions.map((s) => s._id) },
  }).lean();

  const points = rounds
    .map((round) => {
      const mine = results.filter((r) => roundBySession.get(String(r.sessionId)) === String(round._id));
      if (mine.length === 0) return null;
      const avg = (vals: number[]) =>
        vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
      const rubric = Object.fromEntries(
        KEYS.map((k) => [k, avg(mine.map((m) => m.rubric?.[k]).filter((v): v is number => typeof v === "number"))])
      );
      return {
        roundNumber: round.roundNumber,
        score: avg(mine.map((m) => m.score)),
        reviewers: mine.length,
        rubric,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return jsonOk({ points });
}, "Failed to load mock trends");
