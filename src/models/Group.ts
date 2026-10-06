import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  joinCode: string;
  joinCodeExpiresAt: Date;
  interviewDate?: Date;
  ownerId: mongoose.Types.ObjectId;
  members: IGroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    joinCode: { type: String, required: true, unique: true },
    joinCodeExpiresAt: { type: Date, required: true },
    interviewDate: { type: Date },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [GroupMemberSchema],
  },
  { timestamps: true }
);

GroupSchema.index({ "members.userId": 1 });

const Group: Model<IGroup> =
  mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
