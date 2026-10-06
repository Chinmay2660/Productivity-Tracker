import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrepTask extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questionId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  dueDate?: Date;
  estimatedMinutes: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrepTaskSchema = new Schema<IPrepTask>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: Schema.Types.ObjectId, ref: "PracticeQuestion" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    dueDate: { type: Date },
    estimatedMinutes: { type: Number, default: 30 },
    completedAt: { type: Date },
  },
  { timestamps: true, strict: false }
);

PrepTaskSchema.index({ userId: 1, groupId: 1 });
PrepTaskSchema.index({ dueDate: 1 });
PrepTaskSchema.index(
  { userId: 1, questionId: 1 },
  { unique: true, partialFilterExpression: { questionId: { $type: "objectId" } } }
);

if (mongoose.models.PrepTask) {
  mongoose.deleteModel("PrepTask");
}

const PrepTask: Model<IPrepTask> = mongoose.model<IPrepTask>("PrepTask", PrepTaskSchema);

export default PrepTask;
