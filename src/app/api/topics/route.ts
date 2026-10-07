import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc } from "@/lib/services";
import Topic from "@/models/Topic";
import TopicProgress from "@/models/TopicProgress";
import Subject from "@/models/Subject";
import type { ContentScope } from "@/types";

export async function GET(request: Request) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const subjectId = searchParams.get("subjectId");
    const scope = searchParams.get("scope") as ContentScope | "all" | null;

    const subjectFilter: Record<string, unknown>[] = [];
    if (groupId && (!scope || scope === "all" || scope === "group")) {
      subjectFilter.push({ groupId, scope: "group", isActive: true });
    }
    if (!scope || scope === "all" || scope === "personal") {
      subjectFilter.push({ userId, scope: "personal", isActive: true });
    }

    const subjects = await Subject.find(
      subjectFilter.length === 1 ? subjectFilter[0] : { $or: subjectFilter }
    ).lean();
    const subjectIds = subjects.map((s) => s._id);
    const subjectMap = new Map(subjects.map((s) => [String(s._id), s.name]));

    const topicFilter: Record<string, unknown> = {
      subjectId: { $in: subjectIds },
    };
    if (groupId) topicFilter.groupId = groupId;
    if (subjectId) topicFilter.subjectId = subjectId;

    const topics = await Topic.find(topicFilter).sort({ order: 1 }).lean();

    const progress = await TopicProgress.find({ userId, topicId: { $in: topics.map((t) => t._id) } }).lean();
    const progressMap = new Map(progress.map((p) => [String(p.topicId), p]));

    const result = topics.map((t) => {
      const p = progressMap.get(String(t._id));
      return {
        ...serializeDoc(t),
        subjectName: subjectMap.get(String(t.subjectId)),
        userStatus: p?.status,
        userConfidence: p?.confidence,
        userStudyMinutes: p?.studyMinutes,
      };
    });

    return jsonOk(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to fetch topics", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const body = await request.json();
    const { subjectId, groupId, name, priority } = body;
    if (!subjectId || !groupId || !name?.trim()) {
      return jsonError("subjectId, groupId, and name are required");
    }

    const subject = await Subject.findById(subjectId).lean();
    if (!subject) return jsonError("Subject not found", 404);
    if (subject.scope === "personal" && String(subject.userId) !== userId) {
      return jsonError("Subject does not belong to you", 403);
    }
    if (subject.scope === "group" && String(subject.groupId) !== groupId) {
      return jsonError("Subject does not belong to this group", 403);
    }

    const count = await Topic.countDocuments({ subjectId });
    const topic = await Topic.create({
      subjectId,
      groupId,
      name: name.trim(),
      priority: priority ?? "medium",
      order: count,
    });

    return jsonOk(serializeDoc(topic), 201);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to create topic", 500);
  }
}
