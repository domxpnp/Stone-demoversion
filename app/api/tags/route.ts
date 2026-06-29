import { NextResponse } from "next/server";
import { listTags, createTag, renameTag, deleteTag } from "@/lib/tags";
import { parseId } from "@/lib/lookups";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// GET /api/tags — the master keyword vocabulary as [{ id, name }]
// (public; the Collection keyword filter and the admin Tags page both read here).
export async function GET() {
  return NextResponse.json(await listTags());
}

// POST /api/tags — create one keyword. Body: { name }.
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกคีย์เวิร์ด" }, { status: 400 });
  }

  const tag = await createTag(name);
  if (!tag) {
    return NextResponse.json({ error: "มีคีย์เวิร์ดนี้อยู่แล้ว" }, { status: 409 });
  }
  return NextResponse.json(tag, { status: 201 });
}

// PUT /api/tags — rename one keyword. Body: { id, name }.
export async function PUT(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = parseId(b.id);
  if (id === null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกคีย์เวิร์ด" }, { status: 400 });
  }

  const tag = await renameTag(id, name);
  if (!tag) {
    return NextResponse.json(
      { error: "เปลี่ยนชื่อไม่ได้ — ไม่พบคีย์เวิร์ด หรือชื่อซ้ำ" },
      { status: 409 }
    );
  }
  return NextResponse.json(tag);
}

// DELETE /api/tags — soft-delete one keyword. Body: { id }.
export async function DELETE(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = parseId(b.id);
  if (id === null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const ok = await deleteTag(id);
  if (!ok) {
    return NextResponse.json({ error: "ไม่พบคีย์เวิร์ด" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
