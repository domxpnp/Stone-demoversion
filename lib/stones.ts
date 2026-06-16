import { prisma } from "@/lib/prisma";
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
