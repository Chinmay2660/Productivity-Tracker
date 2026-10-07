import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import { isGroupMember, serializeDoc } from "@/lib/services";
import Group from "@/models/Group";
import User from "@/models/User";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id, memberId } = await params;

    const group = await Group.findById(id);
    if (!group) return jsonError("Group not found", 404);

    const callerRole = isGroupMember(group, userId);
    if (!callerRole) return jsonError("Unauthorized", 403);

    const targetMember = group.members.find((m) => String(m.userId) === memberId);
    if (!targetMember) return jsonError("Member not found", 404);

    const isSelf = memberId === userId;
    const isOwner = targetMember.role === "owner";

    if (isOwner) return jsonError("Cannot remove the group owner", 400);

    if (!isSelf && callerRole !== "owner") {
      return jsonError("Only the owner can remove members", 403);
    }

    group.members = group.members.filter((m) => String(m.userId) !== memberId);
    await group.save();

    const memberUser = await User.findById(memberId);
    if (memberUser && String(memberUser.activeGroupId) === id) {
      memberUser.activeGroupId = undefined;
      await memberUser.save();
    }

    return jsonOk(serializeDoc(group));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to remove member", 500);
  }
}
