import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc } from "@/lib/services";
import Topic from "@/models/Topic";
import TopicProgress from "@/models/TopicProgress";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { ...updates } = body;

    if (updates.status || updates.confidence || updates.studyMinutes || updates.notes) {
      const progressUpdates: Record<string, unknown> = {};
      if (updates.status) progressUpdates.status = updates.status;
      if (updates.confidence) progressUpdates.confidence = updates.confidence;
      if (updates.studyMinutes !== undefined) progressUpdates.studyMinutes = updates.studyMinutes;
      if (updates.notes !== undefined) progressUpdates.notes = updates.notes;
      progressUpdates.lastStudied = new Date();

      const progress = await TopicProgress.findOneAndUpdate(
        { userId, topicId: id },
        progressUpdates,
        { new: true, upsert: true }
      ).lean();

      if (updates.status === "practiced" || updates.status === "revised") {
        const nextRevision = new Date();
        nextRevision.setDate(nextRevision.getDate() + (updates.status === "practiced" ? 3 : 7));
        await Topic.findByIdAndUpdate(id, { nextRevision });
      }

      return jsonOk(serializeDoc(progress!));
    }

    const topic = await Topic.findByIdAndUpdate(
      id,
      {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.status && { status: updates.status }),
        ...(updates.confidence && { confidence: updates.confidence }),
        ...(updates.priority && { priority: updates.priority }),
      },
      { new: true }
    ).lean();

    if (!topic) return jsonError("Topic not found", 404);
    return jsonOk(serializeDoc(topic));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to update topic", 500);
  }
}
