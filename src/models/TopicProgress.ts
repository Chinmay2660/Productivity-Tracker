import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITopicProgress extends Document {
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  status: "not_started" | "learning" | "practiced" | "revised" | "interview_ready";
  confidence: "weak" | "okay" | "strong";
  studyMinutes: number;
  lastStudied?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopicProgressSchema = new Schema<ITopicProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    status: {
      type: String,
      enum: ["not_started", "learning", "practiced", "revised", "interview_ready"],
      default: "not_started",
    },
    confidence: { type: String, enum: ["weak", "okay", "strong"], default: "weak" },
    studyMinutes: { type: Number, default: 0 },
    lastStudied: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

TopicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
TopicProgressSchema.index({ userId: 1 });

const TopicProgress: Model<ITopicProgress> =
  mongoose.models.TopicProgress ||
  mongoose.model<ITopicProgress>("TopicProgress", TopicProgressSchema);

export default TopicProgress;
