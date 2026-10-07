import mongoose, { Schema, Document } from "mongoose";
import { registerModel } from "@/lib/mongoose-register";

export interface IMockInterviewSlot extends Document {
  groupId: mongoose.Types.ObjectId;
  roundId: mongoose.Types.ObjectId;
  intervieweeId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  scheduledBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MockInterviewSlotSchema = new Schema<IMockInterviewSlot>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    roundId: { type: Schema.Types.ObjectId, ref: "MockInterviewRound", required: true },
    intervieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduledAt: { type: Date, required: true },
    scheduledBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MockInterviewSlotSchema.index({ groupId: 1, roundId: 1, intervieweeId: 1 }, { unique: true });

const MockInterviewSlot = registerModel<IMockInterviewSlot>(
  "MockInterviewSlot",
  MockInterviewSlotSchema,
  ["groupId", "roundId", "intervieweeId", "scheduledAt", "scheduledBy"]
);

export default MockInterviewSlot;
