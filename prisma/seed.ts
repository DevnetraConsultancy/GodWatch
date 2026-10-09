import { PrismaClient } from "@prisma/client";
import { QUOTES } from "../src/lib/quotes";
import { ACHIEVEMENT_DEFINITIONS } from "../src/lib/achievements";

const prisma = new PrismaClient();

/**
 * Seed the database with:
 *  - Inspirational quotes (shown on month separators & dashboard)
 *  - Achievement badge definitions
 */
async function main() {
  // Upsert quotes
  for (const q of QUOTES) {
    await prisma.quote.upsert({
      where: { id: `quote-${q.text.slice(0, 40)}` },
      update: { text: q.text, author: q.author },
      create: { id: `quote-${q.text.slice(0, 40)}`, text: q.text, author: q.author },
    });
  }
  console.log(`✓ Seeded ${QUOTES.length} quotes`);

  // Upsert achievement definitions
  for (const a of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: {
        name: a.name,
        description: a.description,
        icon: a.icon,
        criteria: a.criteria as object,
      },
      create: {
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        criteria: a.criteria as object,
      },
    });
  }
  console.log(`✓ Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievements`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

