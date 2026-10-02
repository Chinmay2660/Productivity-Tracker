import { Schema, model, models, Model, Types } from "mongoose";

export type ProgressStatusValue = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "REVISED";

export interface ProgressDocument {
  taskId: Types.ObjectId;
  personId: Types.ObjectId;
  status: ProgressStatusValue;
  remark?: string;
  completedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

const ProgressSchema = new Schema<ProgressDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    personId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "DONE", "REVISED"],
      default: "NOT_STARTED",
    },
    remark: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ProgressSchema.index({ taskId: 1, personId: 1 }, { unique: true });
ProgressSchema.index({ personId: 1 });
ProgressSchema.index({ status: 1 });

const ProgressModel =
  (models.Progress as Model<ProgressDocument>) || model<ProgressDocument>("Progress", ProgressSchema);

export default ProgressModel;
