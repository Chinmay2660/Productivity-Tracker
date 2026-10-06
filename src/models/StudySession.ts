import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  durationMinutes: number;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
    taskId: { type: Schema.Types.ObjectId, ref: "PrepTask" },
    durationMinutes: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StudySessionSchema.index({ userId: 1, completedAt: -1 });

const StudySession: Model<IStudySession> =
  mongoose.models.StudySession ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);

export default StudySession;
