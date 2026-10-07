import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc, updateStudyStreak } from "@/lib/services";
import StudySession from "@/models/StudySession";
import TopicProgress from "@/models/TopicProgress";

export const POST = withAuth(async (request, { userId }) => {
  const body = await request.json();
  const { groupId, subjectId, topicId, taskId, durationMinutes, startedAt } = body;

  if (!durationMinutes) {
    return jsonError("durationMinutes is required");
  }

  const session = await StudySession.create({
    userId,
    groupId,
    subjectId,
    topicId,
    taskId,
    durationMinutes,
    startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - durationMinutes * 60000),
    completedAt: new Date(),
  });

  await updateStudyStreak(userId);

  if (topicId) {
    await TopicProgress.findOneAndUpdate(
      { userId, topicId },
      {
        $inc: { studyMinutes: durationMinutes },
        lastStudied: new Date(),
      },
      { upsert: true }
    );
  }

  return jsonOk(serializeDoc(session), 201);
}, "Failed to save session");
