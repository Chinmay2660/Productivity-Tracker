import { Types, PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Progress from "@/models/Progress";
import Person from "@/models/Person";
import Category from "@/models/Category";
import { jsonOk } from "@/lib/utils";

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const people = await Person.find({ isActive: true }).sort({ createdAt: 1 }).lean();
  const categories = await Category.find({ isActive: true }).sort({ createdAt: 1 }).lean();

  // Total questions by category (all-time, dynamic — no hardcoded category names)
  const totalsByCategoryRaw = await Task.aggregate([
    { $group: { _id: "$categoryId", total: { $sum: 1 } } },
  ]);
  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));
  const totalsByCategory = totalsByCategoryRaw.map((row) => ({
    categoryId: row._id.toString(),
    name: categoryMap.get(row._id.toString())?.name || "Unknown",
    total: row.total,
  }));

  // Range for "today's progress" section (defaults to today if not provided)
  const rangeMatch: Record<string, unknown> = {};
  if (start || end) {
    const dateFilter: Record<string, Date> = {};
    if (start) dateFilter.$gte = new Date(start);
    if (end) dateFilter.$lte = new Date(end);
    rangeMatch.date = dateFilter;
  }

  const tasksInRange = await Task.find(rangeMatch).select("_id").lean();
  const taskIdsInRange = tasksInRange.map((t) => t._id);

  const progressInRange = await Progress.find({ taskId: { $in: taskIdsInRange } }).lean();

  const progressByPerson = new Map<string, { total: number; done: number; revised: number }>();
  for (const person of people) {
    progressByPerson.set(person._id.toString(), { total: 0, done: 0, revised: 0 });
  }
  for (const p of progressInRange) {
    const key = p.personId.toString();
    const entry = progressByPerson.get(key);
    if (!entry) continue;
    entry.total += 1;
    if (p.status === "DONE") entry.done += 1;
    if (p.status === "REVISED") entry.revised += 1;
  }

  const todayProgressByPerson = people.map((person) => {
    const entry = progressByPerson.get(person._id.toString()) || { total: 0, done: 0, revised: 0 };
    const completedCount = entry.done + entry.revised;
    const percent = entry.total > 0 ? Math.round((completedCount / entry.total) * 100) : 0;
    return {
      personId: person._id.toString(),
      name: person.name,
      total: entry.total,
      completed: completedCount,
      percent,
    };
  });

  // Questions table for the range, with per-person status
  const pipeline: PipelineStage[] = [
    { $match: rangeMatch },
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

  const tasks = await Task.aggregate(pipeline);
  const peopleMapAll = new Map(people.map((p) => [p._id.toString(), p]));

  const shapedTasks = tasks.map((task) => ({
    ...task,
    progress: (task.progress || []).map((p: { personId: Types.ObjectId }) => ({
      ...p,
      person: peopleMapAll.get(p.personId.toString()) || null,
    })),
  }));

  // All-time statistics by subject (dynamic — works for any category added later)
  const statsRaw = await Task.aggregate([
    {
      $lookup: {
        from: Progress.collection.name,
        localField: "_id",
        foreignField: "taskId",
        as: "progress",
      },
    },
    { $unwind: { path: "$progress", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { categoryId: "$categoryId", status: "$progress.status" },
        count: { $sum: 1 },
      },
    },
  ]);
  const totalsByCategoryMap = new Map(totalsByCategory.map((t) => [t.categoryId, t.total]));
  const statsBySubject = categories.map((category) => {
    const rows = statsRaw.filter((r) => r._id.categoryId.toString() === category._id.toString());
    const byStatus = { NOT_STARTED: 0, IN_PROGRESS: 0, DONE: 0, REVISED: 0 };
    for (const r of rows) {
      if (r._id.status && r._id.status in byStatus) {
        byStatus[r._id.status as keyof typeof byStatus] = r.count;
      }
    }
    return {
      categoryId: category._id.toString(),
      name: category.name,
      totalQuestions: totalsByCategoryMap.get(category._id.toString()) || 0,
      ...byStatus,
    };
  });

  // All-time overall breakdown by person (for "Individual Progress" — Overall section)
  const overallByPersonRaw = await Progress.aggregate([
    { $group: { _id: { personId: "$personId", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const overallByPerson = people.map((person) => {
    const rows = overallByPersonRaw.filter(
      (r) => r._id.personId.toString() === person._id.toString()
    );
    const byStatus = { NOT_STARTED: 0, IN_PROGRESS: 0, DONE: 0, REVISED: 0 };
    for (const r of rows) {
      if (r._id.status && r._id.status in byStatus) {
        byStatus[r._id.status as keyof typeof byStatus] = r.count;
      }
    }
    return { personId: person._id.toString(), name: person.name, ...byStatus };
  });

  return jsonOk({
    people,
    categories,
    totalsByCategory,
    todayProgressByPerson,
    statsBySubject,
    overallByPerson,
    tasks: shapedTasks,
  });
}
