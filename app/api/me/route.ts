import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  signSession,
  cookieOptions,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import type { AdminRole } from "@/app/admin/adminData";

export const dynamic = "force-dynamic";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// GET /api/me — return the signed-in user, or 401 if there's no valid session.
export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = await verifySession(token);
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json(user);
}

// PUT /api/me — let the signed-in user edit their OWN profile.
// Self-service: works for any role, but cannot change role/active (no self-promotion).
export async function PUT(request: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const me = await prisma.adminUser.findFirst({
    where: { id: session.id, isDeleted: false },
  });
  if (!me) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    initials?: string;
    password?: string;
  };

  const name = (body.name ?? me.name).trim();
  const email = (body.email ?? me.email).trim().toLowerCase();
  const password = (body.password ?? "").trim();

  if (!name || !email) {
    return NextResponse.json(
      { error: "ต้องกรอกชื่อและอีเมล" },
      { status: 400 }
    );
  }
  if (password && password.length < 8) {
    return NextResponse.json(
      { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" },
      { status: 400 }
    );
  }
  if (email !== me.email) {
    const clash = await prisma.adminUser.findUnique({ where: { email } });
    if (clash && clash.id !== me.id) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.adminUser.update({
    where: { id: me.id },
    data: {
      name,
      email,
      initials: (body.initials ?? "").trim() || initialsFrom(name),
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  const session2 = {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role as AdminRole,
    initials: updated.initials ?? "",
  };

  // Re-issue the session cookie so the sidebar/JWT reflect the new name/email.
  const res = NextResponse.json(session2);
  res.cookies.set(
    SESSION_COOKIE,
    await signSession(session2),
    cookieOptions(SESSION_MAX_AGE)
  );
  return res;
}
