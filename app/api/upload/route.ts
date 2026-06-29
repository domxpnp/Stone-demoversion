import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

// Needs the Node runtime for the filesystem; never cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Allowed image types → file extension we save them under.
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

// POST /api/upload — accept one image (multipart field "file"), store it under
// public/uploads/, and return its public path so the caller can save it as `img`.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
  }

  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "รองรับเฉพาะรูปภาพ (jpg, png, webp, avif, gif)" },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "ไฟล์ใหญ่เกิน 8MB" },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;

  // public/uploads/ is gitignored, so it may not exist on a fresh deploy.
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/${filename}`;

  // Best-effort media-library record; never fail the upload if this errors.
  await prisma.mediaAsset
    .create({
      data: { url, filename: file.name || filename, bytes: BigInt(file.size) },
    })
    .catch(() => {});

  return NextResponse.json({ url }, { status: 201 });
}
