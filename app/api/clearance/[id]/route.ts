import { NextResponse } from "next/server";
import {
  parseClearanceItemInput,
  updateClearanceItem,
  setClearanceItemHidden,
  deleteClearanceItem,
} from "@/lib/clearance";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// PUT /api/clearance/:id — full update of one item from the editor.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const input = parseClearanceItemInput(await request.json().catch(() => ({})));

  if (!input.name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อรายการ" }, { status: 400 });
  }

  const item = await updateClearanceItem(params.id, input);
  if (!item) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

// PATCH /api/clearance/:id — lightweight visibility flip (show / hide).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = (await request.json().catch(() => ({}))) as { hidden?: unknown };
  if (typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "invalid hidden" }, { status: 400 });
  }

  const item = await setClearanceItemHidden(params.id, body.hidden);
  if (!item) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

// DELETE /api/clearance/:id — soft-delete.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ok = await deleteClearanceItem(params.id);
  if (!ok) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
