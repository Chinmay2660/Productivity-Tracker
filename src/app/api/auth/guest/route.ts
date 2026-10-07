import { connectToDatabase } from "@/lib/mongodb";
import { buildSessionCookie } from "@/lib/session";
import { jsonOk, jsonError } from "@/lib/utils";
import { serializeDoc } from "@/lib/services";
import { ensureDemoData } from "@/lib/demo-seed";

function guestAuthAllowed(): boolean {
  if (process.env.ALLOW_GUEST_AUTH === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  try {
    if (!guestAuthAllowed()) {
      return jsonError("Guest login is not available", 404);
    }

    await connectToDatabase();
    const user = await ensureDemoData();

    const response = jsonOk({ user: serializeDoc(user) });
    response.headers.set("Set-Cookie", await buildSessionCookie(String(user._id)));
    return response;
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Guest login failed", 500);
  }
}
