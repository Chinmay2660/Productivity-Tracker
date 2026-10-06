import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlanDayItem {
  subjectId: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  label: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface IPlanDay {
  dayNumber: number;
  date: Date;
  items: IPlanDayItem[];
}

export interface IPreparationPlan extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  days: IPlanDay[];
  createdAt: Date;
  updatedAt: Date;
}

const PlanDayItemSchema = new Schema<IPlanDayItem>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
    label: { type: String, required: true },
    estimatedMinutes: { type: Number, default: 45 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const PlanDaySchema = new Schema<IPlanDay>(
  {
    dayNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    items: [PlanDayItemSchema],
  },
  { _id: false }
);

const PreparationPlanSchema = new Schema<IPreparationPlan>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: [PlanDaySchema],
  },
  { timestamps: true }
);

PreparationPlanSchema.index({ userId: 1, groupId: 1 }, { unique: true });

const PreparationPlan: Model<IPreparationPlan> =
  mongoose.models.PreparationPlan ||
  mongoose.model<IPreparationPlan>("PreparationPlan", PreparationPlanSchema);

export default PreparationPlan;
