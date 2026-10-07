import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubject extends Document {
  groupId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  scope: "group" | "personal";
  name: string;
  priority: "critical" | "high" | "medium" | "low";
  description?: string;
  order: number;
  totalQuestions: number;
  contentUnit: "questions" | "videos" | "chapters" | "problems";
  /** Group tracks only — included when picking mock interview questions */
  useForMockInterview: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    scope: { type: String, enum: ["group", "personal"], default: "group" },
    name: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    contentUnit: {
      type: String,
      enum: ["questions", "videos", "chapters", "problems"],
      default: "questions",
    },
    useForMockInterview: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SubjectSchema.index({ groupId: 1, name: 1 });
SubjectSchema.index({ userId: 1, scope: 1 });

const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);

export default Subject;
