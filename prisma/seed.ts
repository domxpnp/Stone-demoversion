import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { STONES, FACETS, TAGS } from "../data/stones";
import {
  CLEARANCE_ITEMS,
  DEFAULT_CLEARANCE_SETTINGS,
} from "../data/clearance";
import { PAGES } from "../app/admin/adminData";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedLookups() {
  // FACETS drive the lookup tables; Color carries an optional hex (left null here).
  for (const [i, name] of FACETS.Material.entries())
    await prisma.material.upsert({ where: { name }, create: { name, sort: i }, update: { sort: i } });
  for (const [i, name] of FACETS.Origin.entries())
    await prisma.origin.upsert({ where: { name }, create: { name, sort: i }, update: { sort: i } });
  for (const [i, name] of FACETS.Finish.entries())
    await prisma.finish.upsert({ where: { name }, create: { name, sort: i }, update: { sort: i } });
  for (const [i, name] of FACETS.Color.entries())
    await prisma.color.upsert({ where: { name }, create: { name, sort: i }, update: { sort: i } });

  for (const [i, name] of TAGS.entries())
    await prisma.tag.upsert({ where: { name }, create: { name, sort: i }, update: { sort: i } });

  const tags = await prisma.tag.findMany();
  return new Map(tags.map((t) => [t.name, t.id]));
}

async function seedStones(tagMap: Map<string, number>) {
  for (const s of STONES) {
    const stone = await prisma.stone.upsert({
      where: { slug: s.id },
      create: {
        slug: s.id,
        name: s.name,
        descEn: s.desc,
        descTh: s.thai,
        applications: s.applications,
        premium: s.premium ?? false,
        status: s.status ?? "published",
        primaryImage: s.img,
        material: { connect: { name: s.material } },
        origin: { connect: { name: s.origin } },
        finish: { connect: { name: s.finish } },
        color: { connect: { name: s.color } },
      },
      update: {
        name: s.name,
        descEn: s.desc,
        descTh: s.thai,
        applications: s.applications,
        premium: s.premium ?? false,
        status: s.status ?? "published",
        primaryImage: s.img,
        material: { connect: { name: s.material } },
        origin: { connect: { name: s.origin } },
        finish: { connect: { name: s.finish } },
        color: { connect: { name: s.color } },
      },
    });

    // rebuild children so re-runs stay clean
    await prisma.stoneSpec.deleteMany({ where: { stoneId: stone.id } });
    await prisma.stoneImage.deleteMany({ where: { stoneId: stone.id } });
    await prisma.stoneTag.deleteMany({ where: { stoneId: stone.id } });

    const specs = Object.entries(s.spec).map(([label, value], sort) => ({
      stoneId: stone.id,
      label,
      value,
      sort,
    }));
    if (specs.length) await prisma.stoneSpec.createMany({ data: specs });

    await prisma.stoneImage.create({
      data: { stoneId: stone.id, url: s.img, isPrimary: true, sort: 0 },
    });

    const links = s.tags
      .filter((t) => tagMap.has(t))
      .map((t) => ({ stoneId: stone.id, tagId: tagMap.get(t)! }));
    if (links.length) await prisma.stoneTag.createMany({ data: links });
  }
}

async function seedClearance() {
  for (const [sort, it] of CLEARANCE_ITEMS.entries()) {
    await prisma.clearanceItem.upsert({
      where: { id: it.id },
      create: {
        id: it.id,
        name: it.name,
        material: it.material,
        image: it.img,
        badge: it.badge,
        hidden: it.hidden ?? false,
        sort,
      },
      update: {
        name: it.name,
        material: it.material,
        image: it.img,
        badge: it.badge,
        hidden: it.hidden ?? false,
        sort,
      },
    });
  }

  const s = DEFAULT_CLEARANCE_SETTINGS;
  // Page copy (hero/section/cta) lives in the jsonb `config` column.
  const config = { hero: s.hero, section: s.section, cta: s.cta };
  await prisma.clearanceSettings.upsert({
    where: { id: true },
    create: {
      id: true,
      enabled: s.enabled,
      navLabel: s.navLabel,
      columns: s.columns,
      showEnquireHover: s.showEnquireHover,
      config,
    },
    update: {
      enabled: s.enabled,
      navLabel: s.navLabel,
      columns: s.columns,
      showEnquireHover: s.showEnquireHover,
      config,
    },
  });
}

async function seedPages() {
  // PAGES is keyed by page id (home/about/contact); each holds editable fields.
  for (const [pageId, page] of Object.entries(PAGES)) {
    await prisma.pageContent.upsert({
      where: { id: pageId },
      create: { id: pageId, label: page.label },
      update: { label: page.label },
    });

    // rebuild fields so re-runs stay clean (mirrors seedStones children)
    await prisma.pageField.deleteMany({ where: { pageId } });
    const fields = page.fields.map((f, sort) => ({
      pageId,
      key: f.key,
      label: f.label,
      type: f.type,
      value: f.value,
      sort,
    }));
    if (fields.length) await prisma.pageField.createMany({ data: fields });
  }
}

async function main() {
  const tagMap = await seedLookups();
  await seedStones(tagMap);
  await seedClearance();
  await seedPages();

  const [stones, tags, clearance, pages] = await Promise.all([
    prisma.stone.count(),
    prisma.tag.count(),
    prisma.clearanceItem.count(),
    prisma.pageContent.count(),
  ]);
  console.log(`✅ Seeded: ${stones} stones, ${tags} tags, ${clearance} clearance items, ${pages} pages`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
