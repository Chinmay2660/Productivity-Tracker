import mongoose, { Schema, Document } from "mongoose";
import { registerModel } from "@/lib/mongoose-register";

export interface IMockInterviewSessionQuestion {
  subjectId: mongoose.Types.ObjectId;
  subjectName: string;
  topicId?: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  question: string;
  source: "practice" | "topic";
}

export interface IMockInterviewSession extends Document {
  groupId: mongoose.Types.ObjectId;
  roundId: mongoose.Types.ObjectId;
  intervieweeId: mongoose.Types.ObjectId;
  questions: IMockInterviewSessionQuestion[];
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MockInterviewSessionSchema = new Schema<IMockInterviewSession>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    roundId: { type: Schema.Types.ObjectId, ref: "MockInterviewRound", required: true },
    intervieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questions: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        subjectName: { type: String, required: true },
        topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
        questionId: { type: Schema.Types.ObjectId, ref: "PracticeQuestion", required: true },
        question: { type: String, required: true },
        source: { type: String, enum: ["practice", "topic"], default: "practice" },
      },
    ],
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MockInterviewSessionSchema.index({ groupId: 1, roundId: 1, intervieweeId: 1 }, { unique: true });

const MockInterviewSession = registerModel<IMockInterviewSession>(
  "MockInterviewSession",
  MockInterviewSessionSchema,
  ["groupId", "roundId", "intervieweeId", "questions", "generatedBy"]
);

export default MockInterviewSession;
