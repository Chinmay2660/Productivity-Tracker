import { withAuth } from "@/lib/api-handler";
import { jsonOk, jsonError } from "@/lib/utils";
import { getPrepInsights } from "@/lib/prep-insights";
import User from "@/models/User";

export const GET = withAuth(async (_request, { userId }) => {
  const user = await User.findById(userId).select("activeGroupId").lean();
  if (!user?.activeGroupId) return jsonError("No active group", 400);
  return jsonOk(await getPrepInsights(userId, String(user.activeGroupId)));
}, "Failed to load prep insights");
