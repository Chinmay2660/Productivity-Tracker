import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc, ensureQuestionTodoTasks } from "@/lib/services";
import PrepTask from "@/models/PrepTask";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const status = searchParams.get("status");

  const filter: Record<string, unknown> = { userId };
  if (groupId) filter.groupId = groupId;
  if (status) filter.status = status;

  if (groupId) await ensureQuestionTodoTasks(userId, groupId);

  const tasks = await PrepTask.find(filter).sort({ priority: 1, dueDate: 1 }).lean();
  const subjects = await Subject.find({ _id: { $in: tasks.map((t) => t.subjectId).filter(Boolean) } }).lean();
  const topics = await Topic.find({ _id: { $in: tasks.map((t) => t.topicId).filter(Boolean) } }).lean();
  const subjectMap = new Map(subjects.map((s) => [String(s._id), s.name]));
  const topicMap = new Map(topics.map((t) => [String(t._id), t.name]));

  return jsonOk(
    tasks.map((t) => ({
      ...serializeDoc(t),
      subjectName: t.subjectId ? subjectMap.get(String(t.subjectId)) : undefined,
      topicName: t.topicId ? topicMap.get(String(t.topicId)) : undefined,
    }))
  );
}, "Failed to fetch tasks");

export const POST = withAuth(async (request, { userId }) => {
  const body = await request.json();
  const { groupId, title, description, priority, subjectId, topicId, dueDate, estimatedMinutes } = body;

  if (!groupId || !title?.trim()) {
    return jsonError("groupId and title are required");
  }

  const task = await PrepTask.create({
    groupId,
    userId,
    title: title.trim(),
    description: description?.trim(),
    priority: priority ?? "medium",
    subjectId,
    topicId,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    estimatedMinutes: estimatedMinutes ?? 30,
  });

  return jsonOk(serializeDoc(task), 201);
}, "Failed to create task");
