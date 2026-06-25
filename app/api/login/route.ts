import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, cookieOptions, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import type { AdminRole } from "@/app/admin/adminData";

export const dynamic = "force-dynamic";

// POST /api/login — verify email + password, set the httpOnly session cookie.
export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const norm = (email ?? "").trim().toLowerCase();
  if (!norm || !password) {
    return NextResponse.json({ error: "กรอกอีเมลและรหัสผ่าน" }, { status: 400 });
  }

  const user = await prisma.adminUser.findFirst({
    where: { email: norm, isDeleted: false },
  });

  // Always run a hash compare (even when the user is missing) so the response
  // time doesn't leak whether the email exists.
  const dummy = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvKZ0p/8e8Vv0fG4Q7rGcN3I3s2.";
  const ok =
    (await bcrypt.compare(password, user?.passwordHash ?? dummy)) &&
    !!user &&
    user.active;

  if (!ok || !user) {
    return NextResponse.json(
      { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ" },
      { status: 401 }
    );
  }

  const token = await signSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AdminRole,
    initials: user.initials ?? "",
  });

  const res = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials ?? "",
  });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE));
  return res;
}
