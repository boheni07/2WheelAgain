import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return Response.redirect(new URL("/login?error=not-Authenticated", request.url));
  }

  const session_ = session as { user: { role: string } };

  if (session_.user.role !== "ADMIN") {
    return Response.redirect(new URL("/login?error=FORBIDDEN", request.url));
  }

  return undefined;
}
