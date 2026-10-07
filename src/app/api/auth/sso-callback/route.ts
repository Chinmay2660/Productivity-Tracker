import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { buildSessionCookie, clearSessionCookie, verifySessionToken } from "@/lib/session";
import { getHomePath } from "@/lib/home";

function loginFailed(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}

export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get("session");
  if (!session) {
    return loginFailed(request);
  }

  const userId = await verifySessionToken(session);
  if (!userId) {
    return loginFailed(request);
  }

  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) {
    return loginFailed(request);
  }

  const response = NextResponse.redirect(new URL(getHomePath({ onboardingComplete: user.onboardingComplete }), request.url));
  response.headers.set("Set-Cookie", await buildSessionCookie(String(user._id)));
  return response;
}
