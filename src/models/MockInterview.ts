import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMockInterview extends Document {
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  interviewerId?: mongoose.Types.ObjectId;
  date: Date;
  subjectId?: mongoose.Types.ObjectId;
  interviewer?: string;
  score: number;
  questionsAsked: string[];
  strengths: string[];
  weaknesses: string[];
  feedback?: string;
  followUpTopicIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MockInterviewSchema = new Schema<IMockInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "MockInterviewSession" },
    interviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    interviewer: { type: String, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    questionsAsked: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    feedback: { type: String, trim: true },
    followUpTopicIds: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
  },
  { timestamps: true }
);

MockInterviewSchema.index({ userId: 1, groupId: 1 });
MockInterviewSchema.index({ sessionId: 1, interviewerId: 1 }, { unique: true, sparse: true });

const MockInterview: Model<IMockInterview> =
  mongoose.models.MockInterview ||
  mongoose.model<IMockInterview>("MockInterview", MockInterviewSchema);

export default MockInterview;
