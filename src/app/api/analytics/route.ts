import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError, istDateKey } from "@/lib/utils";
import { getUserReadinessBatch, ensureTopicProgress } from "@/lib/services";
import User from "@/models/User";
import Group from "@/models/Group";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import TopicProgress from "@/models/TopicProgress";
import MockInterview from "@/models/MockInterview";
import type { AnalyticsData } from "@/types";

export async function GET(request: Request) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();

    const user = await User.findById(userId).lean();
    if (!user?.activeGroupId) return jsonError("No active group", 400);

    const groupId = String(user.activeGroupId);
    await ensureTopicProgress(userId, groupId);

    const [subjects, topics, mocks, group] = await Promise.all([
      Subject.find({ groupId }).lean(),
      Topic.find({ groupId }).lean(),
      MockInterview.find({ userId, groupId }).lean(),
      Group.findById(groupId).lean(),
    ]);

    const topicIds = topics.map((t) => t._id);
    const progress = await TopicProgress.find({ userId, topicId: { $in: topicIds } }).lean();

    const progressMap = new Map(progress.map((p) => [String(p.topicId), p]));

    const subjectCompletion = subjects.map((s) => {
      const subjectTopics = topics.filter((t) => String(t.subjectId) === String(s._id));
      const completed = subjectTopics.filter((t) => {
        const p = progressMap.get(String(t._id));
        const status = p?.status ?? t.status;
        return status === "revised" || status === "interview_ready";
      }).length;
      return {
        name: s.name,
        percent: subjectTopics.length > 0 ? Math.round((completed / subjectTopics.length) * 100) : 0,
      };
    });

    const statusCounts: Record<string, number> = {};
    for (const t of topics) {
      const p = progressMap.get(String(t._id));
      const status = p?.status ?? t.status;
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }

    const topicStatusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    const mockInterviewScores = mocks.map((m) => ({
      date: istDateKey(m.date),
      score: m.score,
      subject: subjects.find((s) => String(s._id) === String(m.subjectId))?.name ?? "General",
    }));

    let groupStats;
    if (group) {
      const memberIds = (group.members ?? []).map((m) => String(m.userId));
      const readinessMap = await getUserReadinessBatch(memberIds, groupId);
      const readinessValues = [...readinessMap.values()];
      const avgReadiness =
        readinessValues.length > 0
          ? Math.round(readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length)
          : 0;

      groupStats = {
        avgReadiness,
        weakSubjects: subjectCompletion.filter((s) => s.percent < 50).map((s) => s.name),
      };
    }

    const data: AnalyticsData = {
      subjectCompletion,
      topicStatusBreakdown,
      mockInterviewScores,
      groupStats,
    };

    return jsonOk(data);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to fetch analytics", 500);
  }
}
