import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Progress from "@/models/Progress";
import Category from "@/models/Category";
import Person from "@/models/Person";
import { jsonError, jsonOk } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const task = await Task.findById(id).lean();
  if (!task) {
    return jsonError("Task not found", 404);
  }

  const category = await Category.findById(task.categoryId).lean();
  const progress = await Progress.find({ taskId: id }).lean();
  const people = await Person.find({}).lean();
  const peopleMap = new Map(people.map((p) => [p._id.toString(), p]));

  const shaped = {
    ...task,
    category: category || null,
    progress: progress.map((p) => ({
      ...p,
      person: peopleMap.get(p.personId.toString()) || null,
    })),
  };

  return jsonOk(shaped);
}

export async function PATCH(request: Request, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (body.date) update.date = new Date(body.date);
  if (body.categoryId) update.categoryId = body.categoryId;
  if (typeof body.content === "string") update.content = body.content.trim() || undefined;
  if (typeof body.link === "string") update.link = body.link.trim() || undefined;

  const existing = await Task.findById(id);
  if (!existing) {
    return jsonError("Task not found", 404);
  }

  const nextContent = "content" in update ? (update.content as string | undefined) : existing.content;
  const nextLink = "link" in update ? (update.link as string | undefined) : existing.link;

  if (!nextContent && !nextLink) {
    return jsonError("Provide a question/content or a reference link", 422);
  }

  const task = await Task.findByIdAndUpdate(id, update, { new: true });

  if (Array.isArray(body.assignTo)) {
    const assignTo: string[] = body.assignTo;
    const currentProgress = await Progress.find({ taskId: id });
    const currentPersonIds = currentProgress.map((p) => p.personId.toString());

    const toAdd = assignTo.filter((pid) => !currentPersonIds.includes(pid));
    const toRemove = currentPersonIds.filter((pid) => !assignTo.includes(pid));

    if (toAdd.length > 0) {
      await Progress.insertMany(
        toAdd.map((personId) => ({ taskId: id, personId, status: "NOT_STARTED" }))
      );
    }
    if (toRemove.length > 0) {
      await Progress.deleteMany({ taskId: id, personId: { $in: toRemove } });
    }
  }

  return jsonOk(task);
}

export async function DELETE(_request: Request, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    return jsonError("Task not found", 404);
  }
  await Progress.deleteMany({ taskId: id });

  return jsonOk({ deleted: true });
}
