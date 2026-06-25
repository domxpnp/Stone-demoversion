import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

// One-off: create (or reset) the first back-office owner so someone can sign in.
// Override via env: ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@stoneclubthailand.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.ADMIN_NAME ?? "Nattapong S.";
  const initials = name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, name, initials, role: "owner", active: true, passwordHash },
    update: { passwordHash, active: true, isDeleted: false },
  });

  console.log(`✓ owner ready: ${user.email} (password: ${password})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
