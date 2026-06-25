import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// Protect the back-office UI and the user-management API.
// Everything else (public site, /api/login, etc.) stays open.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySession(token);

  const isUserApi = pathname.startsWith("/api/users");

  if (!user) {
    if (isUserApi) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    // Not signed in → AdminApp renders its own Login screen; let the page load.
    return NextResponse.next();
  }

  // Managing accounts is restricted to owner/admin.
  if (isUserApi && user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/users/:path*"],
};
