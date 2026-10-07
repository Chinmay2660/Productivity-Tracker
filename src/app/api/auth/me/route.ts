import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { clearSessionCookie } from "@/lib/session";
import { jsonOk, jsonError } from "@/lib/utils";
import { normalizeUser } from "@/lib/user";
import User from "@/models/User";

function staleSession() {
  const response = jsonError("User not found", 401);
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}

export async function GET(request: Request) {
  try {
    const userId = requireAuthUserId(request);
    await connectToDatabase();
    const user = await User.findById(userId).lean();
    if (!user) return staleSession();
    return jsonOk(normalizeUser(user));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to fetch user", 500);
  }
}
