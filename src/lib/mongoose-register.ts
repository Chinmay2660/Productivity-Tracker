import mongoose, { type Document, type Model, type Schema } from "mongoose";

/** Re-register when hot-reload left an older schema in mongoose.models. */
export function registerModel<T extends Document>(
  name: string,
  schema: Schema<T>,
  requiredPaths: string[] = []
): Model<T> {
  const existing = mongoose.models[name];
  if (existing && requiredPaths.some((path) => !existing.schema.paths[path])) {
    delete mongoose.models[name];
  }
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}
