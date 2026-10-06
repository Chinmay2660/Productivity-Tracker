import { connectToDatabase } from "@/lib/mongodb";
import { isDuplicateKeyError } from "@/lib/db-indexes";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc, isGroupMember } from "@/lib/services";
import { generatePreparationPlan } from "@/lib/plans";
import PreparationPlan from "@/models/PreparationPlan";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import Group from "@/models/Group";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) return jsonError("groupId required");

    const group = await Group.findById(groupId).lean();
    if (!group || !isGroupMember(group, userId)) return jsonError("Unauthorized", 403);

    let planDoc = await PreparationPlan.findOne({ userId, groupId }).lean();
    if (!planDoc) {
      const user = await User.findById(userId).lean();
      const subjects = await Subject.find({ groupId, isActive: true }).lean();
      const topics = await Topic.find({ groupId }).lean();

      const subjectWithTopics = subjects.map((s) => ({
        _id: String(s._id),
        name: s.name,
        topics: topics
          .filter((t) => String(t.subjectId) === String(s._id))
          .map((t) => ({ _id: String(t._id), name: t.name })),
      }));

      const planEnd =
        group.interviewDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const days = generatePreparationPlan({
        subjects: subjectWithTopics,
        interviewDate: planEnd,
        dailyStudyMinutes: user?.dailyStudyMinutes ?? 120,
      });

      try {
        const created = await PreparationPlan.create({
          userId,
          groupId,
          startDate: new Date(),
          endDate: planEnd,
          days,
        });
        planDoc = created.toObject() as NonNullable<typeof planDoc>;
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
        planDoc = await PreparationPlan.findOne({ userId, groupId }).lean();
      }
    }

    return jsonOk(serializeDoc(planDoc));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to fetch plan", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const body = await request.json();
    const { groupId, dayNumber, itemIndex, completed } = body;

    const plan = await PreparationPlan.findOne({ userId, groupId });
    if (!plan) return jsonError("Plan not found", 404);

    const day = plan.days.find((d) => d.dayNumber === dayNumber);
    if (day && day.items[itemIndex]) {
      day.items[itemIndex].completed = completed;
      plan.markModified("days");
      await plan.save();
    }

    return jsonOk(serializeDoc(plan));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to update plan", 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const body = await request.json();
    const { groupId } = body;
    if (!groupId) return jsonError("groupId required");

    const group = await Group.findById(groupId).lean();
    if (!group || !isGroupMember(group, userId)) return jsonError("Unauthorized", 403);

    await PreparationPlan.deleteOne({ userId, groupId });

    const user = await User.findById(userId).lean();
    const subjects = await Subject.find({ groupId, isActive: true }).lean();
    const topics = await Topic.find({ groupId }).lean();

    const subjectWithTopics = subjects.map((s) => ({
      _id: String(s._id),
      name: s.name,
      topics: topics
        .filter((t) => String(t.subjectId) === String(s._id))
        .map((t) => ({ _id: String(t._id), name: t.name })),
    }));

    const planEnd =
      group.interviewDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const days = generatePreparationPlan({
      subjects: subjectWithTopics,
      interviewDate: planEnd,
      dailyStudyMinutes: user?.dailyStudyMinutes ?? 120,
    });

    const plan = await PreparationPlan.create({
      userId,
      groupId,
      startDate: new Date(),
      endDate: planEnd,
      days,
    });

    return jsonOk(serializeDoc(plan));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to regenerate plan", 500);
  }
}
