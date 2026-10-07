import { jsonError } from "@/lib/utils";

export function getAuthUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}

export function requireAuthUserId(request: Request): string {
  const userId = getAuthUserId(request);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export function unauthorized() {
  return jsonError("Unauthorized", 401);
}
