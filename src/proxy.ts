import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_API = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/guest",
  "/api/auth/google",
  "/api/auth/sso-callback",
];

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await getSessionUserId(request);

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API.some((p) => pathname === p)) {
      return NextResponse.next();
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const headers = new Headers(request.headers);
    headers.delete("x-user-id");
    headers.set("x-user-id", userId);
    return NextResponse.next({ request: { headers } });
  }

  // ponytail: don't redirect /login from cookie alone — stale sessions loop with AppShell
  if (PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
