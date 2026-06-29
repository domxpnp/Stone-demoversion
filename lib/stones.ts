import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import type { Stone } from "@/data/stones";

// Pull a stone row + its relations and reshape it into the flat `Stone`
// shape the public site already consumes (see data/stones.ts).
export const stoneInclude = {
  material: true,
  origin: true,
  finish: true,
  color: true,
  specs: { where: { isDeleted: false }, orderBy: { sort: "asc" } },
  images: { where: { isDeleted: false }, orderBy: { sort: "asc" } },
  stoneTags: { where: { isDeleted: false }, include: { tag: true } },
} as const;

type StoneRow = Awaited<
  ReturnType<typeof prisma.stone.findFirstOrThrow<{ include: typeof stoneInclude }>>
>;

export function toStone(s: StoneRow): Stone {
  const spec: Record<string, string> = {};
  for (const sp of s.specs) spec[sp.label] = sp.value ?? "";

  return {
    id: s.slug,
    name: s.name,
    material: s.material?.name ?? "",
    origin: s.origin?.name ?? "",
    finish: s.finish?.name ?? "",
    color: s.color?.name ?? "",
    img: s.primaryImage ?? s.images[0]?.url ?? "",
    desc: s.descEn ?? "",
    thai: s.descTh ?? "",
    spec,
    applications: s.applications ?? "",
    tags: s.stoneTags.map((st) => st.tag.name),
    premium: s.premium,
    status: s.status === "published" ? "published" : "draft",
  };
}

// ============================ READ SIDE (paginated list) ============================

export interface ListStonesParams {
  page?: number;
  limit?: number;
  q?: string;
  material?: string; // facet name, or "All"/empty for no filter
  status?: string;   // "draft" | "published" | "archived", anything else = all
  sort?: string;     // column id: name | material | origin | finish | premium | status
  dir?: string;      // "asc" | "desc" (defaults to asc)
}

// Map a sortable column id to a Prisma orderBy clause (relations sort by `.name`).
// Falls back to name-asc for anything unknown so the order is always stable.
function stoneOrderBy(sort?: string, dir?: string): Prisma.StoneOrderByWithRelationInput {
  const d: Prisma.SortOrder = dir === "desc" ? "desc" : "asc";
  switch (sort) {
    case "material": return { material: { name: d } };
    case "origin":   return { origin: { name: d } };
    case "finish":   return { finish: { name: d } };
    case "premium":  return { premium: d };
    case "status":   return { status: d };
    case "name":     return { name: d };
    default:         return { name: "asc" };
  }
}

export interface ListStonesResult {
  rows: Stone[];
  total: number;       // rows matching the filter (ignoring page)
  page: number;
  limit: number;
  totalPages: number;
}

// Server-side pagination for the admin catalogue. Pushes search + facet/status
// filtering into the DB so we never load the whole catalogue (and every thumbnail)
// at once. Caps `limit` so a crafted query can't ask for everything.
export async function listStones(params: ListStonesParams): Promise<ListStonesResult> {
  const page = Math.max(1, Math.floor(params.page || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit || 20)));
  const q = (params.q || "").trim();
  const material = params.material && params.material !== "All" ? params.material : null;

  const where: Prisma.StoneWhereInput = { isDeleted: false };
  if (material) where.material = { name: material };
  if (params.status === "draft" || params.status === "published" || params.status === "archived") {
    where.status = params.status;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { origin: { name: { contains: q, mode: "insensitive" } } },
      { color: { name: { contains: q, mode: "insensitive" } } },
      { material: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.stone.count({ where }),
    prisma.stone.findMany({
      where,
      include: stoneInclude,
      orderBy: stoneOrderBy(params.sort, params.dir),
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    rows: rows.map(toStone),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ============================ WRITE SIDE (admin CRUD) ============================

type WriteStatus = "draft" | "published" | "archived";

// Clean shape the route writes from — the flat `Stone` the admin editor sends,
// minus its client-side `id`/slug (identity is resolved from the URL instead).
export interface StoneInput {
  name: string;
  material: string;
  origin: string;
  finish: string;
  color: string;
  img: string;
  desc: string;
  thai: string;
  applications: string;
  premium: boolean;
  status: WriteStatus;
  tags: string[];
  spec: Record<string, string>;
}

// The public site uses a stone's slug as its id (see data/stones.ts), so we
// derive one from the name the same way the admin list used to.
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `stone-${Date.now()}`
  );
}

// Coerce an untrusted JSON body into a StoneInput, dropping anything unexpected.
export function parseStoneInput(body: unknown): StoneInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const rawStatus = str(b.status);
  const status: WriteStatus =
    rawStatus === "published" || rawStatus === "archived" ? rawStatus : "draft";

  const spec: Record<string, string> = {};
  if (b.spec && typeof b.spec === "object") {
    for (const [k, v] of Object.entries(b.spec as Record<string, unknown>)) {
      const key = k.trim();
      if (key) spec[key] = str(v);
    }
  }

  const tags = Array.isArray(b.tags)
    ? [...new Set(b.tags.map(str).map((t) => t.trim()).filter(Boolean))]
    : [];

  return {
    name: str(b.name).trim(),
    material: str(b.material).trim(),
    origin: str(b.origin).trim(),
    finish: str(b.finish).trim(),
    color: str(b.color).trim(),
    img: str(b.img).trim(),
    desc: str(b.desc),
    thai: str(b.thai),
    applications: str(b.applications),
    premium: b.premium === true,
    status,
    tags,
    spec,
  };
}

// Find-or-create a lookup row by name (Material/Origin/Finish/Color), so a new
// facet typed into the editor doesn't fail the write.
function relConnect(name: string) {
  return name
    ? { connectOrCreate: { where: { name }, create: { name } } }
    : undefined;
}

// Resolve the Stone primary-key uuid from a slug or uuid; null if not found.
async function resolveStoneId(idOrSlug: string): Promise<string | null> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );
  const row = await prisma.stone.findFirst({
    where: {
      isDeleted: false,
      OR: isUuid ? [{ slug: idOrSlug }, { id: idOrSlug }] : [{ slug: idOrSlug }],
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

// Rebuild the child rows (specs + tag links) for a stone — mirrors the seed:
// wipe and recreate so an edit can't leave orphans behind.
async function rebuildChildren(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  stoneId: string,
  input: StoneInput
) {
  await tx.stoneSpec.deleteMany({ where: { stoneId } });
  await tx.stoneTag.deleteMany({ where: { stoneId } });

  const specs = Object.entries(input.spec).map(([label, value], sort) => ({
    stoneId,
    label,
    value,
    sort,
  }));
  if (specs.length) await tx.stoneSpec.createMany({ data: specs });

  if (input.tags.length) {
    for (const name of input.tags) {
      await tx.tag.upsert({ where: { name }, create: { name }, update: {} });
    }
    const tagRows = await tx.tag.findMany({
      where: { name: { in: input.tags } },
      select: { id: true },
    });
    await tx.stoneTag.createMany({
      data: tagRows.map((t) => ({ stoneId, tagId: t.id })),
      skipDuplicates: true,
    });
  }
}

// Shared scalar/relation payload for create + update.
function stoneScalarData(input: StoneInput) {
  return {
    name: input.name,
    descEn: input.desc,
    descTh: input.thai,
    applications: input.applications,
    premium: input.premium,
    status: input.status,
    primaryImage: input.img,
  };
}

// Create a stone with a unique slug derived from its name. Returns the flat shape.
export async function createStone(input: StoneInput): Promise<Stone> {
  const base = slugify(input.name);
  let slug = base;
  for (let n = 2; await prisma.stone.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }

  const { id } = await prisma.$transaction(async (tx) => {
    const created = await tx.stone.create({
      data: {
        slug,
        ...stoneScalarData(input),
        material: relConnect(input.material),
        origin: relConnect(input.origin),
        finish: relConnect(input.finish),
        color: relConnect(input.color),
      },
      select: { id: true },
    });
    await rebuildChildren(tx, created.id, input);
    return created;
  });

  const full = await prisma.stone.findUniqueOrThrow({
    where: { id },
    include: stoneInclude,
  });
  return toStone(full);
}

// Update an existing stone (slug stays stable so public links don't break).
// Returns the flat shape, or null if the stone doesn't exist.
export async function updateStone(
  idOrSlug: string,
  input: StoneInput
): Promise<Stone | null> {
  const id = await resolveStoneId(idOrSlug);
  if (!id) return null;

  await prisma.$transaction(async (tx) => {
    await tx.stone.update({
      where: { id },
      data: {
        ...stoneScalarData(input),
        material: relConnect(input.material) ?? { disconnect: true },
        origin: relConnect(input.origin) ?? { disconnect: true },
        finish: relConnect(input.finish) ?? { disconnect: true },
        color: relConnect(input.color) ?? { disconnect: true },
      },
    });
    await rebuildChildren(tx, id, input);
  });

  const full = await prisma.stone.findUniqueOrThrow({
    where: { id },
    include: stoneInclude,
  });
  return toStone(full);
}

// Flip only the publish state — used by the catalogue list's eye toggle.
export async function setStoneStatus(
  idOrSlug: string,
  status: WriteStatus
): Promise<Stone | null> {
  const id = await resolveStoneId(idOrSlug);
  if (!id) return null;
  await prisma.stone.update({ where: { id }, data: { status } });
  const full = await prisma.stone.findUniqueOrThrow({
    where: { id },
    include: stoneInclude,
  });
  return toStone(full);
}

// Soft-delete (matches the rest of the schema). Returns false if not found.
export async function deleteStone(idOrSlug: string): Promise<boolean> {
  const id = await resolveStoneId(idOrSlug);
  if (!id) return false;
  await prisma.stone.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return true;
}
