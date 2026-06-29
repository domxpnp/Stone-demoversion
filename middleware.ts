import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// Protect the back-office UI and the user-management API.
// Everything else (public site, /api/login, etc.) stays open.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySession(token);

  const isUserApi = pathname.startsWith("/api/users");
  // Reading the catalogue is open; creating/editing/deleting stones is not.
  const isStoneWrite =
    pathname.startsWith("/api/stones") &&
    req.method !== "GET" &&
    req.method !== "HEAD";
  // Reading the clearance page is open (the public site needs it); editing isn't.
  const isClearanceWrite =
    pathname.startsWith("/api/clearance") &&
    req.method !== "GET" &&
    req.method !== "HEAD";
  // Reading facets/tags is open (the Collection filters need them); editing isn't.
  const isFacetWrite =
    (pathname.startsWith("/api/facets") || pathname.startsWith("/api/tags")) &&
    req.method !== "GET" &&
    req.method !== "HEAD";
  // The media library is back-office only — even reading it needs a session.
  const isMedia = pathname.startsWith("/api/media");
  const isMediaWrite =
    isMedia && req.method !== "GET" && req.method !== "HEAD";
  // Uploading media is back-office only.
  const isUpload = pathname.startsWith("/api/upload");
  const isWrite =
    isStoneWrite || isClearanceWrite || isFacetWrite || isMediaWrite || isUpload;

  if (!user) {
    if (isUserApi || isWrite || isMedia) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    // Not signed in → AdminApp renders its own Login screen; let the page load.
    return NextResponse.next();
  }

  // Managing accounts is restricted to owner/admin.
  if (isUserApi && user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Viewers are read-only; they can't mutate content or upload media.
  if (isWrite && user.role === "viewer") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/users/:path*",
    "/api/stones/:path*",
    "/api/clearance/:path*",
    "/api/facets/:path*",
    "/api/tags/:path*",
    "/api/media/:path*",
    "/api/upload/:path*",
  ],
};
