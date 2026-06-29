import { NextResponse } from "next/server";
import { parseMediaInput, updateMedia, deleteMedia } from "@/lib/media";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// PUT /api/media/:id — edit the asset's metadata (filename + alt text).
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const input = parseMediaInput(await request.json().catch(() => ({})));
  const asset = await updateMedia(params.id, {
    filename: input.filename,
    alt: input.alt,
  });
  if (!asset) {
    return NextResponse.json({ error: "media not found" }, { status: 404 });
  }
  return NextResponse.json(asset);
}

// DELETE /api/media/:id — soft-delete.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const ok = await deleteMedia(params.id);
  if (!ok) {
    return NextResponse.json({ error: "media not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
