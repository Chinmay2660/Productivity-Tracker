import { connectToDatabase } from "@/lib/mongodb";
import Person from "@/models/Person";
import { jsonError, jsonOk } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return jsonError("Name cannot be empty", 422);
    }
    update.name = trimmed;
  }
  if (typeof body.isActive === "boolean") {
    update.isActive = body.isActive;
  }

  const person = await Person.findByIdAndUpdate(id, update, { new: true });
  if (!person) {
    return jsonError("Person not found", 404);
  }
  return jsonOk(person);
}

export async function DELETE(request: Request, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const person = await Person.findByIdAndDelete(id);
  if (!person) {
    return jsonError("Person not found", 404);
  }
  return jsonOk({ deleted: true });
}
