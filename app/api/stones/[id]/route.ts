import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stoneInclude, toStone } from "@/lib/stones";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// GET /api/stones/:id — one stone, looked up by its public slug or its uuid.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // `id` column is a uuid; comparing it against a non-uuid slug would make
  // Postgres throw, so only match on id when the value actually looks like one.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const row = await prisma.stone.findFirst({
    where: {
      isDeleted: false,
      OR: isUuid ? [{ slug: id }, { id }] : [{ slug: id }],
    },
    include: stoneInclude,
  });

  if (!row) {
    return NextResponse.json({ error: "stone not found" }, { status: 404 });
  }

  return NextResponse.json(toStone(row));
}
