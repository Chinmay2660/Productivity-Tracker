import { jsonError } from "@/lib/utils";

export async function GET() {
  return jsonError("Not available", 403);
}

export async function POST() {
  return jsonError("Use /api/auth/register", 403);
}
