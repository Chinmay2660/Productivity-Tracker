import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc } from "@/lib/services";
import PrepTask from "@/models/PrepTask";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.title) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description?.trim();
    if (body.priority) updates.priority = body.priority;
    if (body.status) {
      updates.status = body.status;
      if (body.status === "completed") updates.completedAt = new Date();
    }
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.estimatedMinutes !== undefined) updates.estimatedMinutes = body.estimatedMinutes;

    const task = await PrepTask.findOneAndUpdate({ _id: id, userId }, updates, { new: true }).lean();
    if (!task) return jsonError("Task not found", 404);
    return jsonOk(serializeDoc(task));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to update task", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;
    const result = await PrepTask.findOneAndDelete({ _id: id, userId });
    if (!result) return jsonError("Task not found", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to delete task", 500);
  }
}
