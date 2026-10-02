import { connectToDatabase } from "@/lib/mongodb";
import Person from "@/models/Person";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const filter = includeInactive ? {} : { isActive: true };
  const people = await Person.find(filter).sort({ createdAt: 1 }).lean();
  return jsonOk(people);
}

export async function POST(request: Request) {
  await connectToDatabase();
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return jsonError("Name is required", 422);
  }

  const person = await Person.create({ name, isActive: true });
  return jsonOk(person, 201);
}
