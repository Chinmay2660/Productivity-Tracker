import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPracticeQuestion extends Document {
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  scope: "group" | "personal";
  sourceGroupQuestionId?: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  practiceDate: Date;
  content: string;
  link?: string;
  difficulty: "easy" | "medium" | "hard";
  status: "not_started" | "add_to_todo" | "in_progress" | "revised" | "done";
  confidence: "weak" | "okay" | "strong";
  lastPracticed?: Date;
  firstCompletedAt?: Date;
  pointsAwarded?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PracticeQuestionSchema = new Schema<IPracticeQuestion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    scope: { type: String, enum: ["group", "personal"], default: "personal" },
    sourceGroupQuestionId: { type: Schema.Types.ObjectId, ref: "PracticeQuestion" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
    practiceDate: { type: Date, required: true },
    content: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    status: {
      type: String,
      enum: ["not_started", "add_to_todo", "in_progress", "revised", "done"],
      default: "not_started",
    },
    confidence: { type: String, enum: ["weak", "okay", "strong"], default: "weak" },
    lastPracticed: { type: Date },
    firstCompletedAt: { type: Date },
    pointsAwarded: { type: Number, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

PracticeQuestionSchema.index({ userId: 1, groupId: 1 });
PracticeQuestionSchema.index({ groupId: 1, scope: 1 });
PracticeQuestionSchema.index({ groupId: 1, practiceDate: 1 });
PracticeQuestionSchema.index({ userId: 1, practiceDate: 1 });
// Partial unique index on userId+sourceGroupQuestionId is managed in db-indexes.ts
// (mongoose syncIndexes can rebuild it without partialFilterExpression and fail on nulls).

PracticeQuestionSchema.set("autoIndex", false);

const PracticeQuestion: Model<IPracticeQuestion> =
  mongoose.models.PracticeQuestion ||
  mongoose.model<IPracticeQuestion>("PracticeQuestion", PracticeQuestionSchema);

export default PracticeQuestion;
