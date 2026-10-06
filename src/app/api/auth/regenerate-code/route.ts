import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { generateAuthCode, hashAuthCode } from "@/lib/auth";
import { checkAuthRateLimit } from "@/lib/auth-rate-limit";
import { jsonOk, jsonError } from "@/lib/utils";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    if (!checkAuthRateLimit(request, "login", 10, 60 * 60 * 1000)) {
      return jsonError("Too many code regeneration attempts. Try again later.", 429);
    }

    const userId = requireAuthUserId(request);
    await connectToDatabase();

    const authCode = generateAuthCode();
    const user = await User.findByIdAndUpdate(
      userId,
      { authCodeHash: hashAuthCode(authCode) },
      { new: true }
    ).lean();
    if (!user) return jsonError("User not found", 404);

    return jsonOk({ authCode });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
    return jsonError(err instanceof Error ? err.message : "Failed to regenerate code", 500);
  }
}
