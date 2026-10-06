import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc, isGroupMember } from "@/lib/services";
import Subject from "@/models/Subject";
import Group from "@/models/Group";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { totalQuestions, name, description, contentUnit, useForMockInterview } = body;

    const subject = await Subject.findById(id);
    if (!subject || !subject.isActive) return jsonError("Subject not found", 404);

    if (subject.scope === "group") {
      if (!subject.groupId) return jsonError("Invalid group subject", 400);
      const group = await Group.findById(subject.groupId).lean();
      if (!group || !isGroupMember(group, userId)) {
        return jsonError("Not a member of this group", 403);
      }
    } else if (String(subject.userId) !== userId) {
      return jsonError("Forbidden", 403);
    }

    const updates: Record<string, unknown> = {};
    if (totalQuestions !== undefined) {
      const n = Number(totalQuestions);
      if (!Number.isFinite(n) || n < 0) return jsonError("totalQuestions must be a non-negative number");
      updates.totalQuestions = Math.round(n);
    }
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || undefined;
    if (contentUnit !== undefined) {
      const validUnits = ["questions", "videos", "chapters", "problems"];
      if (!validUnits.includes(contentUnit)) {
        return jsonError("contentUnit must be questions, videos, chapters, or problems");
      }
      updates.contentUnit = contentUnit;
    }
    if (useForMockInterview !== undefined) {
      if (subject.scope !== "group") {
        return jsonError("useForMockInterview only applies to group tracks");
      }
      updates.useForMockInterview = Boolean(useForMockInterview);
    }

    if (Object.keys(updates).length === 0) return jsonError("No valid fields to update");

    const updated = await Subject.findByIdAndUpdate(id, updates, { new: true }).lean();
    return jsonOk(serializeDoc(updated!));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to update subject", 500);
  }
}
