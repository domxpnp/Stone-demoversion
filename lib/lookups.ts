// The facet tables (Material/Origin/Finish/Color) and the Tag table all share
// the same shape — an int id, a unique `name`, a `sort`, plus the soft-delete
// columns. This module drives all of them through one set of CRUD helpers so the
// per-table wrappers (lib/facets.ts, lib/tags.ts) stay tiny.

export interface LookupOption {
  id: number;
  name: string;
}

const select = { id: true, name: true } as const;

// Minimal structural view of an identical Prisma delegate. Prisma generates a
// distinct (incompatible) type per model, so we describe just the methods we use
// and the wrappers cast their concrete delegate to this shape.
export interface LookupDelegate {
  findMany(args: unknown): Promise<LookupOption[]>;
  findUnique(args: unknown): Promise<{ id: number; isDeleted: boolean } | null>;
  findFirst(args: unknown): Promise<{ sort: number } | null>;
  create(args: unknown): Promise<LookupOption>;
  update(args: unknown): Promise<LookupOption>;
}

// Live options, ordered the way the seed/admin set them (sort, then name).
export function listLookup(d: LookupDelegate): Promise<LookupOption[]> {
  return d.findMany({
    where: { isDeleted: false },
    orderBy: [{ sort: "asc" }, { name: "asc" }],
    select,
  });
}

// Create an option, appended at the end of the order. If a soft-deleted row of
// the same name exists we revive it instead of tripping the unique index.
// Returns null on an empty name or an already-active duplicate.
export async function createLookup(
  d: LookupDelegate,
  name: string
): Promise<LookupOption | null> {
  const clean = name.trim();
  if (!clean) return null;

  const existing = await d.findUnique({
    where: { name: clean },
    select: { id: true, isDeleted: true },
  });
  if (existing) {
    if (!existing.isDeleted) return null; // active duplicate
    return d.update({
      where: { id: existing.id },
      data: { isDeleted: false, deletedAt: null },
      select,
    });
  }

  const last = await d.findFirst({
    orderBy: { sort: "desc" },
    select: { sort: true },
  });
  return d.create({
    data: { name: clean, sort: (last?.sort ?? -1) + 1 },
    select,
  });
}

// Rename an option. The Stone foreign keys reference these rows by id, so the
// new name propagates everywhere automatically. Returns null if the row is
// missing/deleted, or if the new name collides with another active option.
export async function renameLookup(
  d: LookupDelegate,
  id: number,
  name: string
): Promise<LookupOption | null> {
  const clean = name.trim();
  if (!clean) return null;

  const cur = await d.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!cur || cur.isDeleted) return null;

  const clash = await d.findUnique({
    where: { name: clean },
    select: { id: true, isDeleted: true },
  });
  if (clash && (clash as { id: number }).id !== id) return null;

  return d.update({ where: { id }, data: { name: clean }, select });
}

// Soft-delete (matches the rest of the schema). Stones keep their stored value;
// the option just stops showing up in pickers/filters. False if not found.
export async function deleteLookup(
  d: LookupDelegate,
  id: number
): Promise<boolean> {
  const cur = await d.findUnique({
    where: { id },
    select: { id: true, isDeleted: true },
  });
  if (!cur || cur.isDeleted) return false;
  await d.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return true;
}

// Coerce an untrusted numeric id (route/body params arrive as strings/unknown).
export function parseId(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}
