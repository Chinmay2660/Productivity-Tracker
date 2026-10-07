import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import {
  jsonOk,
  jsonError,
  isJoinCodeExpired,
  isValidJoinCode,
  JOIN_CODE_TTL_MINUTES,
} from "@/lib/utils";
import { isGroupMember, issueJoinCode } from "@/lib/services";
import Group from "@/models/Group";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;

    const group = await Group.findById(id);
    if (!group) return jsonError("Group not found", 404);
    if (isGroupMember(group, userId) !== "owner") {
      return jsonError("Only owner can regenerate join code", 403);
    }

    if (
      isValidJoinCode(group.joinCode) &&
      !isJoinCodeExpired(group.joinCodeExpiresAt)
    ) {
      return jsonError(
        `Current invite code is still active. Wait until it expires (${JOIN_CODE_TTL_MINUTES} min) before generating a new one.`,
        400
      );
    }

    const { joinCode, joinCodeExpiresAt } = await issueJoinCode(group, id);
    return jsonOk({ joinCode, joinCodeExpiresAt: joinCodeExpiresAt.toISOString() });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to regenerate code", 500);
  }
}
