import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PageContent } from "@/app/admin/adminData";

// PUT /api/pages/:id  — save one page's edited fields back to the DB.
// Body shape matches the admin's PageContent: { label, fields: [{ key, value, ... }] }
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = (await request.json()) as PageContent;

  // Make sure the page exists before touching its fields.
  const exists = await prisma.pageContent.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "page not found" }, { status: 404 });
  }

  // One transaction so the whole page saves (or fails) as a unit.
  await prisma.$transaction([
    prisma.pageContent.update({
      where: { id },
      data: { label: body.label },
    }),
    // Admin only edits `value`; match each field by (pageId, key).
    ...body.fields.map((f) =>
      prisma.pageField.updateMany({
        where: { pageId: id, key: f.key, isDeleted: false },
        data: { value: f.value },
      })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
