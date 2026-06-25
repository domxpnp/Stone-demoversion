import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AdminAccount, AdminRole } from "@/app/admin/adminData";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

const ROLES: AdminRole[] = ["owner", "admin", "editor", "viewer"];

// Build initials from a name when the client didn't supply them.
function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function toAccount(row: {
  id: string;
  name: string;
  initials: string | null;
  email: string;
  role: string;
  active: boolean;
}): AdminAccount {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials ?? initialsFrom(row.name),
    email: row.email,
    role: row.role as AdminRole,
    active: row.active,
  };
}

// GET /api/users — every back-office account (skip soft-deleted rows).
export async function GET() {
  const rows = await prisma.adminUser.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(rows.map(toAccount));
}

// POST /api/users — create one back-office account.
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AdminAccount> & { password?: string };

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role: AdminRole = ROLES.includes(body.role as AdminRole)
    ? (body.role as AdminRole)
    : "viewer";

  if (!name || !email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" },
      { status: 400 }
    );
  }

  // Email is unique — reject duplicates (incl. soft-deleted) with a clear 409.
  const clash = await prisma.adminUser.findUnique({ where: { email } });
  if (clash) {
    return NextResponse.json(
      { error: "อีเมลนี้ถูกใช้งานแล้ว" },
      { status: 409 }
    );
  }

  const row = await prisma.adminUser.create({
    data: {
      name,
      email,
      role,
      initials: (body.initials ?? "").trim() || initialsFrom(name),
      active: body.active ?? true,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  return NextResponse.json(toAccount(row), { status: 201 });
}
