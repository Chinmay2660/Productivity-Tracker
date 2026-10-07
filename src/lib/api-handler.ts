import { connectToDatabase } from "@/lib/mongodb";
import { requireAuthUserId, unauthorized } from "@/lib/api-auth";
import { jsonError } from "@/lib/utils";

type AuthContext = { userId: string };

export function withAuth(
  handler: (request: Request, ctx: AuthContext) => Promise<Response>,
  fallback = "Request failed"
) {
  return async (request: Request) => {
    try {
      const userId = requireAuthUserId(request);
      await connectToDatabase();
      return await handler(request, { userId });
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") return unauthorized();
      return jsonError(err instanceof Error ? err.message : fallback, 500);
    }
  };
}
