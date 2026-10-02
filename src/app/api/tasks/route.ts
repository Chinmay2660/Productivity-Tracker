import { Types, PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Progress from "@/models/Progress";
import Person from "@/models/Person";
import Category from "@/models/Category";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const categoryId = searchParams.get("categoryId");
  const personId = searchParams.get("personId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const match: Record<string, unknown> = {};
  if (start || end) {
    const dateFilter: Record<string, Date> = {};
    if (start) dateFilter.$gte = new Date(start);
    if (end) dateFilter.$lte = new Date(end);
    match.date = dateFilter;
  }
  if (categoryId) {
    match.categoryId = new Types.ObjectId(categoryId);
  }
  if (search) {
    match.$or = [
      { content: { $regex: search, $options: "i" } },
      { link: { $regex: search, $options: "i" } },
    ];
  }

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { date: -1, createdAt: -1 } },
    {
      $lookup: {
        from: Category.collection.name,
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: Progress.collection.name,
        localField: "_id",
        foreignField: "taskId",
        as: "progress",
      },
    },
  ];

  if (personId) {
    pipeline.push({
      $match: { "progress.personId": new Types.ObjectId(personId) },
    });
  }

  if (status) {
    pipeline.push({
      $match: { "progress.status": status },
    });
  }

  const tasks = await Task.aggregate(pipeline);

  const people = await Person.find({}).lean();
  const peopleMap = new Map(people.map((p) => [p._id.toString(), p]));

  const shaped = tasks.map((task) => ({
    ...task,
    progress: (task.progress || []).map((p: { personId: Types.ObjectId }) => ({
      ...p,
      person: peopleMap.get(p.personId.toString()) || null,
    })),
  }));

  return jsonOk(shaped);
}

export async function POST(request: Request) {
  await connectToDatabase();
  const body = await request.json();

  const { date, categoryId, content, link, assignTo, questions } = body;

  if (!date || !categoryId) {
    return jsonError("Date and subject are required", 422);
  }

  const assignedPersonIds: string[] = Array.isArray(assignTo) ? assignTo : [];

  // Bulk mode: an array of { content?, link? } question entries for the same date/category
  if (Array.isArray(questions) && questions.length > 0) {
    const validEntries = questions.filter(
      (q: { content?: string; link?: string }) =>
        (q.content && q.content.trim()) || (q.link && q.link.trim())
    );

    if (validEntries.length === 0) {
      return jsonError("Each question must have content or a link", 422);
    }

    const createdTasks = await Task.insertMany(
      validEntries.map((q: { content?: string; link?: string }) => ({
        date: new Date(date),
        categoryId,
        content: q.content?.trim() || undefined,
        link: q.link?.trim() || undefined,
      }))
    );

    if (assignedPersonIds.length > 0) {
      const progressDocs = createdTasks.flatMap((task) =>
        assignedPersonIds.map((personId) => ({
          taskId: task._id,
          personId,
          status: "NOT_STARTED",
        }))
      );
      await Progress.insertMany(progressDocs);
    }

    return jsonOk(createdTasks, 201);
  }

  // Single task mode
  const trimmedContent = typeof content === "string" ? content.trim() : "";
  const trimmedLink = typeof link === "string" ? link.trim() : "";

  if (!trimmedContent && !trimmedLink) {
    return jsonError("Provide a question/content or a reference link", 422);
  }

  const task = await Task.create({
    date: new Date(date),
    categoryId,
    content: trimmedContent || undefined,
    link: trimmedLink || undefined,
  });

  if (assignedPersonIds.length > 0) {
    await Progress.insertMany(
      assignedPersonIds.map((personId) => ({
        taskId: task._id,
        personId,
        status: "NOT_STARTED",
      }))
    );
  }

  return jsonOk(task, 201);
}
