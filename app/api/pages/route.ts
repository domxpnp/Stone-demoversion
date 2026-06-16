import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PageContent } from "@/app/admin/adminData";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

export async function GET() {
  // SELECT pages + their fields in one query.
  //  - skip soft-deleted rows (isDeleted)
  //  - order fields by `sort` so they show in the same order as the seed
  const pages = await prisma.pageContent.findMany({
    where: { isDeleted: false },
    include: {
      fields: {
        where: { isDeleted: false },
        orderBy: { sort: "asc" },
      },
    },
  });

  // Reshape the flat DB rows into Record<pageId, { label, fields }>,
  // which is exactly the shape the admin PagesPage already expects.
  const result: Record<string, PageContent> = {};
  for (const p of pages) {
    result[p.id] = {
      label: p.label ?? "",
      fields: p.fields.map((f) => ({
        key: f.key,
        label: f.label ?? "",
        type: (f.type as "text" | "textarea") ?? "text",
        value: f.value ?? "",
      })),
    };
  }

  return NextResponse.json(result);
}
