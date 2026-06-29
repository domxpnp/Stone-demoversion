import { prisma } from "@/lib/prisma";
import {
  type LookupDelegate,
  type LookupOption,
  listLookup,
  createLookup,
  renameLookup,
  deleteLookup,
} from "@/lib/lookups";

// The four catalogue facets, in the order the public Collection sidebar shows
// them. Group names double as the keys the admin/front-end already use.
export const FACET_GROUPS = ["Material", "Origin", "Finish", "Color"] as const;
export type FacetGroup = (typeof FACET_GROUPS)[number];

export type FacetMap = Record<FacetGroup, LookupOption[]>;

export function isFacetGroup(v: unknown): v is FacetGroup {
  return (
    typeof v === "string" && (FACET_GROUPS as readonly string[]).includes(v)
  );
}

// Map a group name to its (structurally identical) Prisma delegate.
function delegate(group: FacetGroup): LookupDelegate {
  switch (group) {
    case "Material":
      return prisma.material as unknown as LookupDelegate;
    case "Origin":
      return prisma.origin as unknown as LookupDelegate;
    case "Finish":
      return prisma.finish as unknown as LookupDelegate;
    case "Color":
      return prisma.color as unknown as LookupDelegate;
  }
}

// All four groups' live options in one shot (used by GET /api/facets).
export async function listFacets(): Promise<FacetMap> {
  const [Material, Origin, Finish, Color] = await Promise.all(
    FACET_GROUPS.map((g) => listLookup(delegate(g)))
  );
  return { Material, Origin, Finish, Color };
}

export const createFacet = (group: FacetGroup, name: string) =>
  createLookup(delegate(group), name);

export const renameFacet = (group: FacetGroup, id: number, name: string) =>
  renameLookup(delegate(group), id, name);

export const deleteFacet = (group: FacetGroup, id: number) =>
  deleteLookup(delegate(group), id);
