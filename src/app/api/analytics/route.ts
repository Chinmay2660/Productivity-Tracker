import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Progress from "@/models/Progress";
import Person from "@/models/Person";
import Category from "@/models/Category";
import { jsonOk } from "@/lib/utils";

export async function GET() {
  await connectToDatabase();

  const people = await Person.find({ isActive: true }).sort({ createdAt: 1 }).lean();
  const categories = await Category.find({ isActive: true }).sort({ createdAt: 1 }).lean();

  // Questions added over time (by day)
  const addedOverTime = await Task.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Questions completed over time (progress marked DONE, by completedAt day)
  const completedOverTime = await Progress.aggregate([
    { $match: { status: "DONE", completedAt: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Progress by person (status breakdown)
  const progressByPersonRaw = await Progress.aggregate([
    { $group: { _id: { personId: "$personId", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const progressByPerson = people.map((person) => {
    const rows = progressByPersonRaw.filter(
      (r) => r._id.personId.toString() === person._id.toString()
    );
    const byStatus = { NOT_STARTED: 0, IN_PROGRESS: 0, DONE: 0, REVISED: 0 };
    for (const r of rows) {
      byStatus[r._id.status as keyof typeof byStatus] = r.count;
    }
    return { personId: person._id.toString(), name: person.name, ...byStatus };
  });

  // Progress by subject (status breakdown)
  const progressByCategoryRaw = await Task.aggregate([
    {
      $lookup: {
        from: Progress.collection.name,
        localField: "_id",
        foreignField: "taskId",
        as: "progress",
      },
    },
    { $unwind: "$progress" },
    {
      $group: {
        _id: { categoryId: "$categoryId", status: "$progress.status" },
        count: { $sum: 1 },
      },
    },
  ]);
  const progressBySubject = categories.map((category) => {
    const rows = progressByCategoryRaw.filter(
      (r) => r._id.categoryId.toString() === category._id.toString()
    );
    const byStatus = { NOT_STARTED: 0, IN_PROGRESS: 0, DONE: 0, REVISED: 0 };
    for (const r of rows) {
      byStatus[r._id.status as keyof typeof byStatus] = r.count;
    }
    return { categoryId: category._id.toString(), name: category.name, ...byStatus };
  });

  // Completed vs pending overall
  const completedVsPendingRaw = await Progress.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const completedVsPending = { NOT_STARTED: 0, IN_PROGRESS: 0, DONE: 0, REVISED: 0 };
  for (const row of completedVsPendingRaw) {
    completedVsPending[row._id as keyof typeof completedVsPending] = row.count;
  }

  return jsonOk({
    categories: categories.map((c) => ({ categoryId: c._id.toString(), name: c.name })),
    people: people.map((p) => ({ personId: p._id.toString(), name: p.name })),
    addedOverTime: addedOverTime.map((r) => ({ date: r._id, count: r.count })),
    completedOverTime: completedOverTime.map((r) => ({ date: r._id, count: r.count })),
    progressByPerson,
    progressBySubject,
    completedVsPending,
  });
}
