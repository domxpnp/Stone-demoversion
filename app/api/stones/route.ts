import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stoneInclude, toStone } from "@/lib/stones";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.stone.findMany({
    where: { isDeleted: false },
    include: stoneInclude,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(rows.map(toStone));
}
