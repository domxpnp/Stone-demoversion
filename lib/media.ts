import { prisma } from "@/lib/prisma";

// Flat shape the admin Media library consumes (BigInt `bytes` reduced to a
// plain number so the row is JSON-serialisable).
export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  alt: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

type MediaRow = {
  id: string;
  url: string;
  filename: string | null;
  alt: string | null;
  bytes: bigint | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
};

export function toMediaAsset(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    url: row.url,
    filename: row.filename ?? "",
    alt: row.alt ?? "",
    bytes: row.bytes == null ? null : Number(row.bytes),
    width: row.width,
    height: row.height,
    createdAt: row.createdAt.toISOString(),
  };
}

// ============================ READ SIDE ============================

// Newest first — the library shows recent uploads at the top.
export async function listMedia(): Promise<MediaAsset[]> {
  const rows = await prisma.mediaAsset.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toMediaAsset);
}

// ============================ WRITE SIDE ============================

export interface MediaInput {
  url: string;
  filename: string;
  alt: string;
}

// Coerce an untrusted JSON body into a clean media input.
export function parseMediaInput(body: unknown): MediaInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    url: str(b.url).trim(),
    filename: str(b.filename).trim(),
    alt: str(b.alt).trim(),
  };
}

// Register an existing path/URL as a library asset (the actual file bytes are
// stored by /api/upload; this is for linking external or already-hosted images).
export async function createMedia(input: MediaInput): Promise<MediaAsset> {
  const row = await prisma.mediaAsset.create({
    data: {
      url: input.url,
      filename: input.filename || input.url.split("/").pop() || input.url,
      alt: input.alt || null,
    },
  });
  return toMediaAsset(row);
}

async function liveMediaId(id: string): Promise<string | null> {
  const row = await prisma.mediaAsset.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });
  return row?.id ?? null;
}

// Update editable metadata (filename + alt text). Null if not found.
export async function updateMedia(
  id: string,
  input: Pick<MediaInput, "filename" | "alt">
): Promise<MediaAsset | null> {
  if (!(await liveMediaId(id))) return null;
  const row = await prisma.mediaAsset.update({
    where: { id },
    data: { filename: input.filename || null, alt: input.alt || null },
  });
  return toMediaAsset(row);
}

// Soft-delete (matches the rest of the schema). False if not found.
export async function deleteMedia(id: string): Promise<boolean> {
  if (!(await liveMediaId(id))) return false;
  await prisma.mediaAsset.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return true;
}
