import { NextResponse } from "next/server";
import { listMedia, createMedia, parseMediaInput } from "@/lib/media";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// GET /api/media — the whole library (back-office only; see middleware).
export async function GET() {
  const rows = await listMedia();
  return NextResponse.json(rows);
}

// POST /api/media — register an existing path/URL as a library asset.
// (File uploads go through /api/upload, which records the asset itself.)
export async function POST(request: Request) {
  const input = parseMediaInput(await request.json().catch(() => ({})));

  if (!input.url) {
    return NextResponse.json({ error: "กรุณาระบุพาธหรือ URL ของรูป" }, { status: 400 });
  }

  const asset = await createMedia(input);
  return NextResponse.json(asset, { status: 201 });
}
