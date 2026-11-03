import mongoose, { Schema, Document, Model } from "mongoose";

export type GroupNoteKind = "cheer" | "nudge";

/** A cheer or nudge one member sends another. */
export interface IGroupNote extends Document {
  groupId: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  kind: GroupNoteKind;
  message?: string;
  emoji?: string;
  readAt?: Date;
  createdAt: Date;
}

const GroupNoteSchema = new Schema<IGroupNote>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["cheer", "nudge"], required: true },
    message: { type: String, trim: true, maxlength: 160 },
    emoji: { type: String, maxlength: 8 },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Inbox lookups and the once-a-day send limit.
GroupNoteSchema.index({ toUserId: 1, groupId: 1, readAt: 1, createdAt: -1 });
GroupNoteSchema.index({ fromUserId: 1, toUserId: 1, kind: 1, createdAt: -1 });

const GroupNote: Model<IGroupNote> =
  mongoose.models.GroupNote || mongoose.model<IGroupNote>("GroupNote", GroupNoteSchema);

export default GroupNote;
