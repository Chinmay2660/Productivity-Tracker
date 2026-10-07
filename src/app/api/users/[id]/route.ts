import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc } from "@/lib/services";
import User from "@/models/User";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUserId = requireAuthUserId(request);
    const { id } = await params;
    if (authUserId !== id) return jsonError("Unauthorized", 403);

    await connectToDatabase();
    const body = await request.json();

    const allowed = [
      "name", "email", "preparationLevel", "dailyStudyMinutes",
      "activeGroupId", "theme", "onboardingComplete", "targetCtcLpa",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.targetCtcLpa !== undefined) {
      const ctc = Number(updates.targetCtcLpa);
      if (!Number.isFinite(ctc) || ctc < 0 || ctc > 200) {
        return jsonError("targetCtcLpa must be between 0 and 200", 400);
      }
      updates.targetCtcLpa = ctc > 0 ? ctc : undefined;
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!user) return jsonError("User not found", 404);
    return jsonOk(serializeDoc(user));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to update user", 500);
  }
}
