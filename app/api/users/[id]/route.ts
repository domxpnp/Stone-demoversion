import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AdminAccount, AdminRole } from "@/app/admin/adminData";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

const ROLES: AdminRole[] = ["owner", "admin", "editor", "viewer"];

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

// PUT /api/users/:id — update one back-office account.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = (await request.json()) as Partial<AdminAccount> & { password?: string };

  const exists = await prisma.adminUser.findFirst({
    where: { id, isDeleted: false },
  });
  if (!exists) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const name = (body.name ?? exists.name).trim();
  const email = (body.email ?? exists.email).trim().toLowerCase();

  if (!name || !email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 }
    );
  }

  // Password is optional on edit — only re-hash when a new one is supplied.
  const password = (body.password ?? "").trim();
  if (password && password.length < 8) {
    return NextResponse.json(
      { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" },
      { status: 400 }
    );
  }

  // If the email changed, make sure it isn't taken by someone else.
  if (email !== exists.email) {
    const clash = await prisma.adminUser.findUnique({ where: { email } });
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }
  }

  const row = await prisma.adminUser.update({
    where: { id },
    data: {
      name,
      email,
      role: ROLES.includes(body.role as AdminRole)
        ? (body.role as AdminRole)
        : exists.role,
      initials: (body.initials ?? "").trim() || initialsFrom(name),
      active: body.active ?? exists.active,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  return NextResponse.json(toAccount(row));
}

// DELETE /api/users/:id — soft-delete (matches the rest of the schema).
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const exists = await prisma.adminUser.findFirst({
    where: { id, isDeleted: false },
  });
  if (!exists) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  await prisma.adminUser.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date(), active: false },
  });

  return NextResponse.json({ ok: true });
}
