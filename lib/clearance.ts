import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CLEARANCE_SETTINGS,
  type BadgeType,
  type ClearanceConfig,
  type ClearanceItem,
  type ClearanceSettings,
} from "@/data/clearance";

const BADGES: BadgeType[] = ["limited", "clearance", "last"];
const COLUMNS = [2, 3, 4] as const;

// ============================ READ SIDE ============================

type ItemRow = {
  id: string;
  name: string;
  material: string | null;
  image: string | null;
  badge: string | null;
  hidden: boolean;
  sort: number;
};

// Reshape a DB row into the flat `ClearanceItem` the site/admin consume.
export function toClearanceItem(row: ItemRow): ClearanceItem {
  const badge = (BADGES as string[]).includes(row.badge ?? "")
    ? (row.badge as BadgeType)
    : "clearance";
  return {
    id: row.id,
    name: row.name,
    material: row.material ?? "",
    img: row.image ?? "",
    badge,
    hidden: row.hidden,
  };
}

type SettingsRow = {
  enabled: boolean;
  navLabel: string | null;
  columns: number | null;
  showEnquireHover: boolean;
  config: unknown;
} | null;

// Merge the scalar columns + the jsonb `config` (hero/section/cta) over the
// defaults so an older/partial row never produces an invalid settings shape.
export function toClearanceSettings(row: SettingsRow): ClearanceSettings {
  const d = DEFAULT_CLEARANCE_SETTINGS;
  if (!row) return d;
  const cfg = (row.config ?? {}) as Partial<
    Pick<ClearanceSettings, "hero" | "section" | "cta">
  >;
  const columns = COLUMNS.includes(row.columns as 2 | 3 | 4)
    ? (row.columns as 2 | 3 | 4)
    : d.columns;
  return {
    enabled: row.enabled,
    navLabel: row.navLabel ?? d.navLabel,
    columns,
    showEnquireHover: row.showEnquireHover,
    hero: { ...d.hero, ...(cfg.hero ?? {}) },
    section: { ...d.section, ...(cfg.section ?? {}) },
    cta: { ...d.cta, ...(cfg.cta ?? {}) },
  };
}

// The full page config (settings + visible-order items) the front page renders.
export async function getClearanceConfig(): Promise<ClearanceConfig> {
  const [settingsRow, itemRows] = await prisma.$transaction([
    prisma.clearanceSettings.findUnique({ where: { id: true } }),
    prisma.clearanceItem.findMany({
      where: { isDeleted: false },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return {
    settings: toClearanceSettings(settingsRow),
    items: itemRows.map(toClearanceItem),
  };
}

// ============================ WRITE SIDE — items ============================

export interface ClearanceItemInput {
  name: string;
  material: string;
  img: string;
  badge: BadgeType;
  hidden: boolean;
}

// Coerce an untrusted JSON body into a clean item input.
export function parseClearanceItemInput(body: unknown): ClearanceItemInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const rawBadge = str(b.badge);
  const badge: BadgeType = (BADGES as string[]).includes(rawBadge)
    ? (rawBadge as BadgeType)
    : "clearance";
  return {
    name: str(b.name).trim(),
    material: str(b.material).trim(),
    img: str(b.img).trim(),
    badge,
    hidden: b.hidden === true,
  };
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `item-${Date.now()}`
  );
}

// Create an item with a unique `clr-…` id, appended at the end of the order.
export async function createClearanceItem(
  input: ClearanceItemInput
): Promise<ClearanceItem> {
  const base = "clr-" + slugify(input.name);
  let id = base;
  for (let n = 2; await prisma.clearanceItem.findUnique({ where: { id } }); n++) {
    id = `${base}-${n}`;
  }

  const last = await prisma.clearanceItem.findFirst({
    where: { isDeleted: false },
    orderBy: { sort: "desc" },
    select: { sort: true },
  });

  const row = await prisma.clearanceItem.create({
    data: {
      id,
      name: input.name,
      material: input.material,
      image: input.img,
      badge: input.badge,
      hidden: input.hidden,
      sort: (last?.sort ?? -1) + 1,
    },
  });
  return toClearanceItem(row);
}

async function liveItemId(id: string): Promise<string | null> {
  const row = await prisma.clearanceItem.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });
  return row?.id ?? null;
}

// Full update of one item. Returns the flat shape, or null if not found.
export async function updateClearanceItem(
  id: string,
  input: ClearanceItemInput
): Promise<ClearanceItem | null> {
  if (!(await liveItemId(id))) return null;
  const row = await prisma.clearanceItem.update({
    where: { id },
    data: {
      name: input.name,
      material: input.material,
      image: input.img,
      badge: input.badge,
      hidden: input.hidden,
    },
  });
  return toClearanceItem(row);
}

// Flip only the hidden flag — used by the list's eye toggle.
export async function setClearanceItemHidden(
  id: string,
  hidden: boolean
): Promise<ClearanceItem | null> {
  if (!(await liveItemId(id))) return null;
  const row = await prisma.clearanceItem.update({
    where: { id },
    data: { hidden },
  });
  return toClearanceItem(row);
}

// Soft-delete (matches the rest of the schema). False if not found.
export async function deleteClearanceItem(id: string): Promise<boolean> {
  if (!(await liveItemId(id))) return false;
  await prisma.clearanceItem.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return true;
}

// Persist a new display order: write each id's index as its `sort`.
export async function reorderClearanceItems(ids: string[]): Promise<void> {
  await prisma.$transaction(
    ids.map((id, sort) =>
      prisma.clearanceItem.update({ where: { id }, data: { sort } })
    )
  );
}

// ============================ WRITE SIDE — settings ============================

// Coerce an untrusted JSON body into a clean settings shape (merged over defaults).
export function parseClearanceSettingsInput(body: unknown): ClearanceSettings {
  const b = (body ?? {}) as Record<string, unknown>;
  const d = DEFAULT_CLEARANCE_SETTINGS;
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" ? v : fallback;
  const obj = (v: unknown) =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : {};

  const hi = obj(b.hero), se = obj(b.section), ct = obj(b.cta);
  const columns = COLUMNS.includes(b.columns as 2 | 3 | 4)
    ? (b.columns as 2 | 3 | 4)
    : d.columns;

  return {
    enabled: b.enabled === true,
    navLabel: str(b.navLabel, d.navLabel).trim() || d.navLabel,
    columns,
    showEnquireHover: b.showEnquireHover === true,
    hero: {
      kicker: str(hi.kicker, d.hero.kicker),
      titleTop: str(hi.titleTop, d.hero.titleTop),
      titleIt: str(hi.titleIt, d.hero.titleIt),
      sub: str(hi.sub, d.hero.sub),
      note: str(hi.note, d.hero.note),
      img: str(hi.img, d.hero.img),
    },
    section: {
      label: str(se.label, d.section.label),
      title: str(se.title, d.section.title),
    },
    cta: {
      label: str(ct.label, d.cta.label),
      title: str(ct.title, d.cta.title),
      body: str(ct.body, d.cta.body),
      primary: str(ct.primary, d.cta.primary),
      secondary: str(ct.secondary, d.cta.secondary),
    },
  };
}

// Upsert the singleton settings row. Page copy lives in the jsonb `config`.
export async function updateClearanceSettings(
  input: ClearanceSettings
): Promise<ClearanceSettings> {
  const config = { hero: input.hero, section: input.section, cta: input.cta };
  const scalar = {
    enabled: input.enabled,
    navLabel: input.navLabel,
    columns: input.columns,
    showEnquireHover: input.showEnquireHover,
    config,
  };
  const row = await prisma.clearanceSettings.upsert({
    where: { id: true },
    create: { id: true, ...scalar },
    update: scalar,
  });
  return toClearanceSettings(row);
}
