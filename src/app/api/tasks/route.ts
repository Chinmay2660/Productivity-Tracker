import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc, ensureQuestionTodoTasks } from "@/lib/services";
import PrepTask from "@/models/PrepTask";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

async function serializeTasksWithNames(
  tasks: {
    _id: unknown;
    subjectId?: unknown;
    topicId?: unknown;
    [key: string]: unknown;
  }[]
) {
  const subjects = await Subject.find({
    _id: { $in: tasks.map((t) => t.subjectId).filter(Boolean) },
  }).lean();
  const topics = await Topic.find({
    _id: { $in: tasks.map((t) => t.topicId).filter(Boolean) },
  }).lean();
  const subjectMap = new Map(subjects.map((s) => [String(s._id), s.name]));
  const topicMap = new Map(topics.map((t) => [String(t._id), t.name]));

  return tasks.map((t) => ({
    ...serializeDoc(t),
    subjectName: t.subjectId ? subjectMap.get(String(t.subjectId)) : undefined,
    topicName: t.topicId ? topicMap.get(String(t.topicId)) : undefined,
  }));
}

const TASK_SORT = { priority: 1, dueDate: 1, createdAt: 1 } as const;

export const GET = withAuth(async (request, { userId }) => {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const status = searchParams.get("status");
  const bucket = searchParams.get("bucket");

  const filter: Record<string, unknown> = { userId };
  if (groupId) filter.groupId = groupId;
  if (bucket === "completed") filter.status = "completed";
  else if (bucket === "active") filter.status = { $ne: "completed" };
  else if (status) filter.status = status;

  if (groupId) await ensureQuestionTodoTasks(userId, groupId);

  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const paginate = pageParam !== null || limitParam !== null;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam ?? "10", 10) || 10));
  const skip = (page - 1) * limit;

  const groupFilter = groupId ? { userId, groupId } : { userId };

  if (paginate) {
    const [tasks, total, activeTotal, completedTotal] = await Promise.all([
      PrepTask.find(filter).sort(TASK_SORT).skip(skip).limit(limit).lean(),
      PrepTask.countDocuments(filter),
      PrepTask.countDocuments({ ...groupFilter, status: { $ne: "completed" } }),
      PrepTask.countDocuments({ ...groupFilter, status: "completed" }),
    ]);
    const items = await serializeTasksWithNames(tasks);
    return jsonOk({ items, total, page, limit, activeTotal, completedTotal });
  }

  const tasks = await PrepTask.find(filter).sort(TASK_SORT).lean();
  return jsonOk(await serializeTasksWithNames(tasks));
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
