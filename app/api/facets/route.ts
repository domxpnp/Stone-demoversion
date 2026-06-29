import { NextResponse } from "next/server";
import {
  listFacets,
  createFacet,
  renameFacet,
  deleteFacet,
  isFacetGroup,
} from "@/lib/facets";
import { parseId } from "@/lib/lookups";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// GET /api/facets — all four facet groups as { Material, Origin, Finish, Color }
// (public; the Collection sidebar and the admin Filters page both read here).
export async function GET() {
  return NextResponse.json(await listFacets());
}

// POST /api/facets — create one option. Body: { group, name }.
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!isFacetGroup(b.group)) {
    return NextResponse.json({ error: "invalid group" }, { status: 400 });
  }
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อตัวเลือก" }, { status: 400 });
  }

  const option = await createFacet(b.group, name);
  if (!option) {
    return NextResponse.json({ error: "มีตัวเลือกนี้อยู่แล้ว" }, { status: 409 });
  }
  return NextResponse.json(option, { status: 201 });
}

// PUT /api/facets — rename one option. Body: { group, id, name }.
export async function PUT(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = parseId(b.id);
  if (!isFacetGroup(b.group) || id === null) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อตัวเลือก" }, { status: 400 });
  }

  const option = await renameFacet(b.group, id, name);
  if (!option) {
    return NextResponse.json(
      { error: "เปลี่ยนชื่อไม่ได้ — ไม่พบตัวเลือก หรือชื่อซ้ำ" },
      { status: 409 }
    );
  }
  return NextResponse.json(option);
}

// DELETE /api/facets — soft-delete one option. Body: { group, id }.
export async function DELETE(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = parseId(b.id);
  if (!isFacetGroup(b.group) || id === null) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const ok = await deleteFacet(b.group, id);
  if (!ok) {
    return NextResponse.json({ error: "ไม่พบตัวเลือก" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
