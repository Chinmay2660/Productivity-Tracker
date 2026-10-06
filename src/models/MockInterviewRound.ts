import mongoose, { Schema, Document } from "mongoose";
import { registerModel } from "@/lib/mongoose-register";

export interface IMockInterviewRound extends Document {
  groupId: mongoose.Types.ObjectId;
  roundNumber: number;
  interviewDate?: Date;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MockInterviewRoundSchema = new Schema<IMockInterviewRound>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    roundNumber: { type: Number, required: true, min: 1 },
    interviewDate: { type: Date },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
  },
  { timestamps: true }
);

MockInterviewRoundSchema.index({ groupId: 1, roundNumber: 1 }, { unique: true });

const MockInterviewRound = registerModel<IMockInterviewRound>(
  "MockInterviewRound",
  MockInterviewRoundSchema,
  ["groupId", "roundNumber", "startsAt", "endsAt"]
);

export default MockInterviewRound;
