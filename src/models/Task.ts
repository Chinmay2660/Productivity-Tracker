import { Schema, model, models, Model, Types } from "mongoose";

export interface TaskDocument {
  date: Date;
  categoryId: Types.ObjectId;
  content?: string;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<TaskDocument>(
  {
    date: { type: Date, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    content: { type: String },
    link: { type: String },
  },
  { timestamps: true }
);

TaskSchema.index({ date: -1 });
TaskSchema.index({ categoryId: 1 });

const TaskModel = (models.Task as Model<TaskDocument>) || model<TaskDocument>("Task", TaskSchema);

export default TaskModel;
