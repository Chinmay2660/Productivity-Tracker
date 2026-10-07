import { withAuth } from "@/lib/api-handler";
import { isDuplicateKeyError } from "@/lib/db-indexes";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc, isGroupMember } from "@/lib/services";
import MockInterview from "@/models/MockInterview";
import MockInterviewSession from "@/models/MockInterviewSession";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import TopicProgress from "@/models/TopicProgress";
import Group from "@/models/Group";
import User from "@/models/User";

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  const filter: Record<string, unknown> = { userId };
  if (groupId) filter.groupId = groupId;

  const interviews = await MockInterview.find(filter).sort({ date: -1 }).lean();
  const subjects = await Subject.find({ _id: { $in: interviews.map((i) => i.subjectId).filter(Boolean) } }).lean();
  const subjectMap = new Map(subjects.map((s) => [String(s._id), s.name]));

  return jsonOk(
    interviews.map((i) => ({
      ...serializeDoc(i),
      subjectName: i.subjectId ? subjectMap.get(String(i.subjectId)) : undefined,
    }))
  );
}, "Failed to fetch interviews");

export const POST = withAuth(async (request, { userId: authUserId }) => {
  const body = await request.json();
  const {
    sessionId,
    intervieweeId,
    groupId,
    date,
    subjectId,
    score,
    questionsAsked,
    strengths,
    weaknesses,
    feedback,
    followUpTopicIds,
  } = body;

  if (!sessionId) {
    return jsonError("sessionId is required");
  }
  if (score === undefined) {
    return jsonError("score is required");
  }

  const session = await MockInterviewSession.findById(sessionId).lean();
  if (!session) return jsonError("Mock session not found", 404);

  const resolvedGroupId = groupId ?? String(session.groupId);
  const resolvedIntervieweeId = intervieweeId ?? String(session.intervieweeId);

  const group = await Group.findById(resolvedGroupId).lean();
  if (!group || !isGroupMember(group, authUserId)) {
    return jsonError("Not a member of this group", 403);
  }
  if (!group.members.some((m) => String(m.userId) === resolvedIntervieweeId)) {
    return jsonError("Interviewee is not a group member", 400);
  }
  if (String(resolvedIntervieweeId) === authUserId) {
    return jsonError("Interviewee cannot score their own mock", 400);
  }
  if (String(session.intervieweeId) !== resolvedIntervieweeId) {
    return jsonError("Session does not match interviewee", 400);
  }

  const existingScore = await MockInterview.findOne({
    sessionId,
    interviewerId: authUserId,
  }).lean();
  if (existingScore) {
    return jsonError("You have already submitted a score for this mock", 409);
  }

  const interviewer = await User.findById(authUserId).lean();
  const sessionQuestions = session.questions.map((q) => `${q.subjectName}: ${q.question}`);
  const sessionTopicIds = session.questions
    .filter((q) => q.topicId)
    .map((q) => String(q.topicId));

  let interview;
  try {
    interview = await MockInterview.create({
      userId: resolvedIntervieweeId,
      groupId: resolvedGroupId,
      sessionId,
      interviewerId: authUserId,
      date: date ? new Date(date) : new Date(),
      subjectId,
      interviewer: interviewer?.name,
      score: Math.min(100, Math.max(0, score)),
      questionsAsked: questionsAsked ?? sessionQuestions,
      strengths: strengths ?? [],
      weaknesses: weaknesses ?? [],
      feedback,
      followUpTopicIds: followUpTopicIds ?? sessionTopicIds,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return jsonError("You have already submitted a score for this mock", 409);
    }
    throw err;
  }

  const priorScoreCount = await MockInterview.countDocuments({ sessionId });
  const topicIds = followUpTopicIds ?? sessionTopicIds;
  if (priorScoreCount === 1 && topicIds.length) {
    const now = new Date();
    await TopicProgress.bulkWrite(
      topicIds.map((topicId: string) => ({
        updateOne: {
          filter: { userId: resolvedIntervieweeId, topicId },
          update: { $set: { confidence: "weak", status: "learning" } },
          upsert: true,
        },
      }))
    );
    await Topic.bulkWrite(
      topicIds.map((topicId: string) => ({
        updateOne: {
          filter: { _id: topicId },
          update: { $set: { nextRevision: now, confidence: "weak" } },
        },
      }))
    );
  }

  return jsonOk(serializeDoc(interview), 201);
}, "Failed to create interview");
