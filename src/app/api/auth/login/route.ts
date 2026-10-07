import { connectToDatabase } from "@/lib/mongodb";
import { normalizeUsername, verifyAuthCode } from "@/lib/auth";
import { buildSessionCookie } from "@/lib/session";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc } from "@/lib/services";
import { checkAuthRateLimit } from "@/lib/auth-rate-limit";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    if (!checkAuthRateLimit(request, "login")) {
      return jsonError("Too many login attempts. Try again later.", 429);
    }

    await connectToDatabase();
    const body = await request.json();
    const username = normalizeUsername(body.username ?? "");
    const code = body.code?.trim();

    if (!username || !code) return jsonError("Username and code are required");

    const user = await User.findOne({ username }).select("+authCodeHash");
    if (!user?.authCodeHash || !verifyAuthCode(code, user.authCodeHash)) {
      return jsonError("Invalid username or code", 401);
    }

    const response = jsonOk({ user: serializeDoc(user) });
    response.headers.set("Set-Cookie", await buildSessionCookie(String(user._id)));
    return response;
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Login failed", 500);
  }
}
