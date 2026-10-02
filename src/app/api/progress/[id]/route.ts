import { connectToDatabase } from "@/lib/mongodb";
import Progress from "@/models/Progress";
import { jsonError, jsonOk } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE", "REVISED"];

export async function PATCH(request: Request, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return jsonError("Invalid status", 422);
    }
    update.status = body.status;
    if (body.status === "DONE") {
      update.completedAt = new Date();
    }
  }
  if (typeof body.remark === "string") {
    update.remark = body.remark;
  }

  const progress = await Progress.findByIdAndUpdate(id, update, { new: true });
  if (!progress) {
    return jsonError("Progress entry not found", 404);
  }
  return jsonOk(progress);
}

export async function DELETE(_request: Request, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const progress = await Progress.findByIdAndDelete(id);
  if (!progress) {
    return jsonError("Progress entry not found", 404);
  }
  return jsonOk({ deleted: true });
}
