import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  stoneInclude,
  toStone,
  parseStoneInput,
  updateStone,
  setStoneStatus,
  deleteStone,
} from "@/lib/stones";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// GET /api/stones/:id — one stone, looked up by its public slug or its uuid.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // `id` column is a uuid; comparing it against a non-uuid slug would make
  // Postgres throw, so only match on id when the value actually looks like one.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const row = await prisma.stone.findFirst({
    where: {
      isDeleted: false,
      OR: isUuid ? [{ slug: id }, { id }] : [{ slug: id }],
    },
    include: stoneInclude,
  });

  if (!row) {
    return NextResponse.json({ error: "stone not found" }, { status: 404 });
  }

  return NextResponse.json(toStone(row));
}

// PUT /api/stones/:id — full update from the catalogue editor.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const input = parseStoneInput(await request.json().catch(() => ({})));

  if (!input.name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อหิน" }, { status: 400 });
  }

  const stone = await updateStone(params.id, input);
  if (!stone) {
    return NextResponse.json({ error: "stone not found" }, { status: 404 });
  }
  return NextResponse.json(stone);
}

// PATCH /api/stones/:id — lightweight status flip (publish / unpublish).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const status =
    body.status === "published" ||
    body.status === "draft" ||
    body.status === "archived"
      ? body.status
      : null;

  if (!status) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const stone = await setStoneStatus(params.id, status);
  if (!stone) {
    return NextResponse.json({ error: "stone not found" }, { status: 404 });
  }
  return NextResponse.json(stone);
}

// DELETE /api/stones/:id — soft-delete.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ok = await deleteStone(params.id);
  if (!ok) {
    return NextResponse.json({ error: "stone not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
