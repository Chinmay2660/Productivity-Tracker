import { Schema, model, models, Model } from "mongoose";

export interface PersonDocument {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema = new Schema<PersonDocument>(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PersonModel = (models.Person as Model<PersonDocument>) || model<PersonDocument>("Person", PersonSchema);

export default PersonModel;
