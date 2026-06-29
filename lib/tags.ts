import { prisma } from "@/lib/prisma";
import {
  type LookupDelegate,
  type LookupOption,
  listLookup,
  createLookup,
  renameLookup,
  deleteLookup,
} from "@/lib/lookups";

// Master keyword vocabulary — managed on the admin "Tags" page, assigned per
// stone, and surfaced as the public Collection's keyword filter. Structurally a
// lookup table just like the facets, so it rides the same generic helpers.
const tagDelegate = prisma.tag as unknown as LookupDelegate;

export type TagOption = LookupOption;

export const listTags = () => listLookup(tagDelegate);
export const createTag = (name: string) => createLookup(tagDelegate, name);
export const renameTag = (id: number, name: string) =>
  renameLookup(tagDelegate, id, name);
export const deleteTag = (id: number) => deleteLookup(tagDelegate, id);
