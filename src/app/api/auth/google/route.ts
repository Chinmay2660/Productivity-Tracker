import { NextRequest, NextResponse } from "next/server";
import { googleAuthUrl } from "@/lib/apps";

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || undefined;
  return NextResponse.redirect(googleAuthUrl(returnTo));
}
