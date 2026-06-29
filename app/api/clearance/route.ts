import { NextResponse } from "next/server";
import {
  getClearanceConfig,
  createClearanceItem,
  parseClearanceItemInput,
  parseClearanceSettingsInput,
  updateClearanceSettings,
  reorderClearanceItems,
} from "@/lib/clearance";

// Always hit the DB — don't let Next cache this route as static.
export const dynamic = "force-dynamic";

// GET /api/clearance — full page config { settings, items } (public; the front
// page and the admin editor both read from here).
export async function GET() {
  const config = await getClearanceConfig();
  return NextResponse.json(config);
}

// POST /api/clearance — create one clearance item.
export async function POST(request: Request) {
  const input = parseClearanceItemInput(await request.json().catch(() => ({})));

  if (!input.name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อรายการ" }, { status: 400 });
  }

  const item = await createClearanceItem(input);
  return NextResponse.json(item, { status: 201 });
}

// PUT /api/clearance — save the page settings (hero/section/cta + display options).
export async function PUT(request: Request) {
  const input = parseClearanceSettingsInput(await request.json().catch(() => ({})));
  const settings = await updateClearanceSettings(input);
  return NextResponse.json(settings);
}

// PATCH /api/clearance — persist a new item display order: { order: string[] }.
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { order?: unknown };
  const order = Array.isArray(body.order)
    ? body.order.filter((x): x is string => typeof x === "string")
    : null;

  if (!order) {
    return NextResponse.json({ error: "invalid order" }, { status: 400 });
  }

  await reorderClearanceItems(order);
  return NextResponse.json({ ok: true });
}
