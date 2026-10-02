import { Schema, model, models, Model } from "mongoose";

export interface CategoryDocument {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CategoryModel =
  (models.Category as Model<CategoryDocument>) || model<CategoryDocument>("Category", CategorySchema);

export default CategoryModel;
