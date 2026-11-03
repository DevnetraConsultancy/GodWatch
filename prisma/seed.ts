import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENT_DEFINITIONS } from "../src/lib/achievements";

const prisma = new PrismaClient();

/** Seed (idempotent): achievement badge definitions. */
async function main(): Promise<void> {
  for (const a of ACHIEVEMENT_DEFINITIONS) {
    const data = {
      name: a.name,
      description: a.description,
      icon: a.icon,
      criteria: { type: a.criteria.type, value: a.criteria.value },
    };
    await prisma.achievement.upsert({ where: { key: a.key }, update: data, create: { key: a.key, ...data } });
  }
  console.log(`Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievements`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
