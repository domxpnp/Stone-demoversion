import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { AdminRole } from "@/app/admin/adminData";

// Name of the httpOnly cookie that carries the signed session.
export const SESSION_COOKIE = "sc_session";
// Session lifetime — 7 days.
const MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  initials: string;
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

// Sign a session token. Runs in the Node runtime (login route).
export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

// Verify a session token. Edge-compatible (used by middleware) and Node.
export async function verifySession(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const { id, name, email, role, initials } = payload as Record<string, unknown>;
    if (typeof id !== "string" || typeof email !== "string") return null;
    return {
      id,
      name: String(name ?? ""),
      email,
      role: (role as AdminRole) ?? "viewer",
      initials: String(initials ?? ""),
    };
  } catch {
    return null;
  }
}

// Cookie options shared by login (set) and logout (clear).
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export const SESSION_MAX_AGE = MAX_AGE;
