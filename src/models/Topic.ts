import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITopic extends Document {
  subjectId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  name: string;
  status: "not_started" | "learning" | "practiced" | "revised" | "interview_ready";
  confidence: "weak" | "okay" | "strong";
  priority: "critical" | "high" | "medium" | "low";
  studyMinutes: number;
  lastStudied?: Date;
  nextRevision?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["not_started", "learning", "practiced", "revised", "interview_ready"],
      default: "not_started",
    },
    confidence: { type: String, enum: ["weak", "okay", "strong"], default: "weak" },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    studyMinutes: { type: Number, default: 0 },
    lastStudied: { type: Date },
    nextRevision: { type: Date },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TopicSchema.index({ subjectId: 1 });
TopicSchema.index({ groupId: 1 });

const Topic: Model<ITopic> =
  mongoose.models.Topic || mongoose.model<ITopic>("Topic", TopicSchema);

export default Topic;
