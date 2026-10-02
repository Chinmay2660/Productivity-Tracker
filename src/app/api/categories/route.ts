import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const filter = includeInactive ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ createdAt: 1 }).lean();
  return jsonOk(categories);
}

export async function POST(request: Request) {
  await connectToDatabase();
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return jsonError("Name is required", 422);
  }

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existing = await Category.findOne({ name: new RegExp(`^${escaped}$`, "i") });
  if (existing) {
    return jsonError("A category with this name already exists", 409);
  }

  const category = await Category.create({ name, isActive: true });
  return jsonOk(category, 201);
}
