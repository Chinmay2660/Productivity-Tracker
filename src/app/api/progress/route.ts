import { connectToDatabase } from "@/lib/mongodb";
import Progress from "@/models/Progress";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const personId = searchParams.get("personId");
  const status = searchParams.get("status");

  const filter: Record<string, unknown> = {};
  if (taskId) filter.taskId = taskId;
  if (personId) filter.personId = personId;
  if (status) filter.status = status;

  const progress = await Progress.find(filter).sort({ updatedAt: -1 }).lean();
  return jsonOk(progress);
}

const VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE", "REVISED"];

export async function POST(request: Request) {
  await connectToDatabase();
  const body = await request.json();
  const { taskId, personId, status, remark } = body;

  if (!taskId || !personId) {
    return jsonError("taskId and personId are required", 422);
  }

  const resolvedStatus = status && VALID_STATUSES.includes(status) ? status : "NOT_STARTED";

  const progress = await Progress.findOneAndUpdate(
    { taskId, personId },
    {
      $setOnInsert: { taskId, personId },
      $set: {
        status: resolvedStatus,
        ...(remark !== undefined ? { remark } : {}),
        ...(resolvedStatus === "DONE" ? { completedAt: new Date() } : {}),
      },
    },
    { new: true, upsert: true }
  );

  return jsonOk(progress, 201);
}
