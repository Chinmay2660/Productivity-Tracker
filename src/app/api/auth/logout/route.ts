import { clearSessionCookie } from "@/lib/session";
import { jsonOk } from "@/lib/utils";

export async function POST() {
  const response = jsonOk({ ok: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
