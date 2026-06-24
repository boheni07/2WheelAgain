import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login?error=not-Authenticated", request.url));
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login?error=FORBIDDEN", request.url));
  }

  return NextResponse.next();
}
