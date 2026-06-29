import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stoneInclude, toStone, parseStoneInput, createStone, listStones } from "@/lib/stones";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// GET /api/stones
//   ?page=&limit=&q=&material=&status=  → paginated envelope { rows, total, page, limit, totalPages }
//   (no params)                         → full array (backward-compatible: dashboard/facets/tags/inquiries)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Opt into pagination only when the caller asks for it, so existing
  // full-catalogue consumers keep getting a plain array.
  const paginated = ["page", "limit", "q", "material", "status", "sort"].some((k) =>
    searchParams.has(k)
  );

  if (paginated) {
    const num = (v: string | null) => (v ? Number(v) : undefined);
    const result = await listStones({
      page: num(searchParams.get("page")),
      limit: num(searchParams.get("limit")),
      q: searchParams.get("q") ?? undefined,
      material: searchParams.get("material") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      dir: searchParams.get("dir") ?? undefined,
    });
    return NextResponse.json(result);
  }

  const rows = await prisma.stone.findMany({
    where: { isDeleted: false },
    include: stoneInclude,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(rows.map(toStone));
}

// POST /api/stones — create one catalogue stone.
export async function POST(request: Request) {
  const input = parseStoneInput(await request.json().catch(() => ({})));

  if (!input.name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อหิน" }, { status: 400 });
  }

  const stone = await createStone(input);
  return NextResponse.json(stone, { status: 201 });
}
