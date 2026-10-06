import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import {
  serializeDoc,
  isGroupMember,
  canManageGroup,
  getMemberStatsBatch,
  getGroupGamificationStats,
} from "@/lib/services";
import Group from "@/models/Group";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import type { GroupRole } from "@/types";
import { getInterviewCountdown } from "@/lib/readiness";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;

    const groupDoc = await Group.findById(id);
    if (!groupDoc) return jsonError("Group not found", 404);
    const group = groupDoc.toObject();
    if (!isGroupMember(group, userId)) return jsonError("Unauthorized", 403);

    const [subjects, topics] = await Promise.all([
      Subject.find({ groupId: id, isActive: true }).lean(),
      Topic.find({ groupId: id }).lean(),
    ]);

    const roleMap = new Map(
      group.members.map((m) => [String(m.userId), m.role as GroupRole])
    );
    const memberIds = group.members.map((m) => String(m.userId));
    const [memberStats, gamification] = await Promise.all([
      getMemberStatsBatch(memberIds, id, roleMap),
      getGroupGamificationStats(id, memberIds),
    ]);

    const countdown = getInterviewCountdown(group.interviewDate);

    return jsonOk({
      ...serializeDoc(group),
      subjects: subjects.map(serializeDoc),
      topicCount: topics.length,
      memberStats,
      gamification,
      countdown: {
        ...countdown,
        interviewDate: group.interviewDate?.toISOString() ?? null,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to fetch group", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { name, description, interviewDate } = body;

    const group = await Group.findById(id);
    if (!group) return jsonError("Group not found", 404);

    const role = isGroupMember(group, userId);
    if (!canManageGroup(role)) return jsonError("Unauthorized", 403);

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description?.trim();
    if (interviewDate) group.interviewDate = new Date(interviewDate);
    await group.save();

    return jsonOk(serializeDoc(group));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to update group", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;

    const group = await Group.findById(id);
    if (!group) return jsonError("Group not found", 404);
    if (String(group.ownerId) !== userId) return jsonError("Only owner can delete group", 403);

    await group.deleteOne();
    return jsonOk({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to delete group", 500);
  }
}
