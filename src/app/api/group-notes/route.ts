import mongoose from "mongoose";
import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { isGroupMember } from "@/lib/services";
import { canManageGroup } from "@/lib/group-roles";
import {
  CHEER_EMOJIS,
  NOTE_COOLDOWN_MS,
  NOTE_KINDS,
  NOTE_MAX_LENGTH,
  type NoteKind,
} from "@/lib/group-notes";
import Group from "@/models/Group";
import GroupNote from "@/models/GroupNote";
import User from "@/models/User";

/** Notes sent to the signed-in user in a group, newest first. */
export const GET = withAuth(async (request, { userId }) => {
  const groupId = new URL(request.url).searchParams.get("groupId");
  if (!groupId || !mongoose.isValidObjectId(groupId)) return jsonError("groupId is required");

  const group = await Group.findById(groupId).select("members").lean();
  if (!group || !isGroupMember(group, userId)) return jsonError("Not a member of this group", 403);

  const [notes, unread] = await Promise.all([
    GroupNote.find({ groupId, toUserId: userId }).sort({ createdAt: -1 }).limit(20).lean(),
    GroupNote.countDocuments({ groupId, toUserId: userId, readAt: { $exists: false } }),
  ]);
  const senders = await User.find({ _id: { $in: notes.map((n) => n.fromUserId) } })
    .select("_id name")
    .lean();
  const names = new Map(senders.map((u) => [String(u._id), u.name]));

  return jsonOk({
    unread,
    items: notes.map((n) => ({
      _id: String(n._id),
      kind: n.kind,
      fromUserId: String(n.fromUserId),
      fromName: names.get(String(n.fromUserId)) ?? "A teammate",
      message: n.message,
      emoji: n.emoji,
      createdAt: n.createdAt.toISOString(),
      read: Boolean(n.readAt),
    })),
  });
}, "Failed to load notes");

/**
 * Send a note. Cheers are open to every member; nudges are admin-only.
 * One note of each kind per person per day, so nobody gets spammed.
 */
export const POST = withAuth(async (request, { userId }) => {
  const body = await request.json();
  const { groupId, toUserId, kind, emoji, message } = body as {
    groupId?: string;
    toUserId?: string;
    kind?: NoteKind;
    emoji?: string;
    message?: string;
  };

  if (!groupId || !toUserId || !mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(toUserId)) {
    return jsonError("groupId and toUserId are required");
  }
  if (!kind || !NOTE_KINDS.includes(kind)) return jsonError("Unknown note type");
  if (toUserId === userId) return jsonError("You can't send a note to yourself");

  const group = await Group.findById(groupId).select("members").lean();
  const role = group ? isGroupMember(group, userId) : null;
  if (!group || !role) return jsonError("Not a member of this group", 403);
  if (!group.members.some((m) => String(m.userId) === toUserId)) return jsonError("That person isn't in this group", 400);

  let text: string | undefined;
  let chosenEmoji: string | undefined;
  if (kind === "cheer") {
    chosenEmoji = (CHEER_EMOJIS as readonly string[]).includes(emoji ?? "") ? emoji : CHEER_EMOJIS[0];
  } else {
    if (!canManageGroup(role)) return jsonError("Only admins can send nudges", 403);
    text = message?.trim();
    if (!text) return jsonError("A nudge needs a message");
  }
  if (text && text.length > NOTE_MAX_LENGTH) return jsonError(`Keep it under ${NOTE_MAX_LENGTH} characters`);

  const recent = await GroupNote.exists({
    groupId,
    fromUserId: userId,
    toUserId,
    kind,
    createdAt: { $gte: new Date(Date.now() - NOTE_COOLDOWN_MS) },
  });
  if (recent) return jsonError("You already sent this today. Try again tomorrow.", 429);

  await GroupNote.create({ groupId, fromUserId: userId, toUserId, kind, message: text, emoji: chosenEmoji });
  return jsonOk({ sent: true }, 201);
}, "Failed to send note");

/** Mark notes as read: the given ids, or every unread note in the group. */
export const PATCH = withAuth(async (request, { userId }) => {
  const { groupId, ids } = (await request.json()) as { groupId?: string; ids?: string[] };
  if (!groupId || !mongoose.isValidObjectId(groupId)) return jsonError("groupId is required");

  const filter: Record<string, unknown> = { groupId, toUserId: userId, readAt: { $exists: false } };
  if (Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids.filter((id) => mongoose.isValidObjectId(id)) };
  }
  const result = await GroupNote.updateMany(filter, { readAt: new Date() });
  return jsonOk({ updated: result.modifiedCount });
}, "Failed to update notes");
