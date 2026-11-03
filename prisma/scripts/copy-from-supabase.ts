/**
 * One-off copy of the legacy Supabase database into the new Neon schema.
 *
 *   SOURCE_DATABASE_URL=<supabase direct url> DATABASE_URL=<neon url> npx tsx prisma/scripts/copy-from-supabase.ts
 *
 * - Reads the source with SELECT statements only; the source is never written.
 * - Safe to re-run: every insert skips rows that already exist.
 * - Run migrations and the seed against the target first.
 */
import { Prisma, PrismaClient, type ActivityType, type Status } from "@prisma/client";
import { ACHIEVEMENT_DEFINITIONS } from "../../src/lib/achievements";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("Set SOURCE_DATABASE_URL and DATABASE_URL");
if (sourceUrl === targetUrl) throw new Error("Source and target must be different databases");

const source = new PrismaClient({ datasourceUrl: sourceUrl });
const target = new PrismaClient({ datasourceUrl: targetUrl });

const utcDate = (d: Date): string => d.toISOString().slice(0, 10);

async function count(client: PrismaClient, table: string): Promise<number> {
  const rows = await client.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*)::bigint AS n FROM "${table}"`);
  return Number(rows[0]?.n ?? 0);
}

async function main(): Promise<void> {
  const users = await source.$queryRaw<
    { id: string; name: string | null; email: string; emailVerified: Date | null; image: string | null; createdAt: Date; updatedAt: Date }[]
  >`SELECT "id","name","email","emailVerified","image","createdAt","updatedAt" FROM "User"`;
  await target.user.createMany({ data: users, skipDuplicates: true });

  const accounts = await source.$queryRaw<Prisma.AccountCreateManyInput[]>`
    SELECT "id","userId","type","provider","providerAccountId","refresh_token","access_token",
           "expires_at","token_type","scope","id_token","session_state" FROM "Account"`;
  await target.account.createMany({ data: accounts, skipDuplicates: true });

  const tasks = await source.$queryRaw<
    { id: string; userId: string; name: string; color: string; order: number; archived: boolean; createdAt: Date; updatedAt: Date }[]
  >`SELECT "id","userId","name","color","order","archived","createdAt","updatedAt" FROM "Task"`;
  await target.task.createMany({
    data: tasks.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.name,
      color: t.color,
      order: t.order,
      // Back-filled cells move the effective start earlier at read time.
      startDate: utcDate(t.createdAt),
      archivedOn: t.archived ? utcDate(t.updatedAt) : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    skipDuplicates: true,
  });

  const statuses = await source.$queryRaw<{ id: string; taskId: string; date: string; status: Status; updatedAt: Date }[]>`
    SELECT "id","taskId","date","status"::text AS "status","updatedAt" FROM "TaskStatus" WHERE "status" <> 'PENDING'`;
  for (let i = 0; i < statuses.length; i += 5000) {
    await target.taskStatus.createMany({ data: statuses.slice(i, i + 5000), skipDuplicates: true });
  }

  const notes = await source.$queryRaw<Prisma.NoteCreateManyInput[]>`
    SELECT "id","userId","date","content","createdAt","updatedAt" FROM "Note" WHERE btrim("content") <> ''`;
  await target.note.createMany({ data: notes, skipDuplicates: true });

  const logs = await source.$queryRaw<
    { id: string; userId: string; type: ActivityType; metadata: Prisma.JsonValue; ip: string | null; userAgent: string | null; createdAt: Date }[]
  >`SELECT "id","userId","type"::text AS "type","metadata","ip","userAgent","createdAt" FROM "ActivityLog"`;
  for (let i = 0; i < logs.length; i += 5000) {
    await target.activityLog.createMany({
      data: logs.slice(i, i + 5000).map((l) => ({ ...l, metadata: l.metadata ?? Prisma.JsonNull })),
      skipDuplicates: true,
    });
  }

  const settings = await source.$queryRaw<
    { id: string; userId: string; dailyReminderEnabled: boolean; dailyReminderTime: string | null; defaultTaskColor: string; createdAt: Date; updatedAt: Date }[]
  >`SELECT "id","userId","dailyReminderEnabled","dailyReminderTime","defaultTaskColor","createdAt","updatedAt" FROM "Settings"`;
  await target.settings.createMany({
    data: settings.map((s) => ({ ...s, dailyReminderTime: s.dailyReminderTime ?? "20:00" })),
    skipDuplicates: true,
  });

  // Badges: map legacy achievement ids to the new definitions by key.
  const targetAchievements = await target.achievement.findMany({ select: { id: true, key: true } });
  const idByKey = new Map(targetAchievements.map((a) => [a.key, a.id]));
  const missing = ACHIEVEMENT_DEFINITIONS.filter((d) => !idByKey.has(d.key));
  if (missing.length > 0) throw new Error("Run the seed against the target before copying badges");
  const unlocked = await source.$queryRaw<{ userId: string; key: string; unlockedAt: Date }[]>`
    SELECT ua."userId", a."key", ua."unlockedAt" FROM "UserAchievement" ua JOIN "Achievement" a ON a."id" = ua."achievementId"`;
  await target.userAchievement.createMany({
    data: unlocked
      .filter((u) => idByKey.has(u.key))
      .map((u) => ({ userId: u.userId, achievementId: idByKey.get(u.key)!, unlockedAt: u.unlockedAt })),
    skipDuplicates: true,
  });

  const checks: [string, number, number][] = [
    ["User", users.length, await count(target, "User")],
    ["Account", accounts.length, await count(target, "Account")],
    ["Task", tasks.length, await count(target, "Task")],
    ["TaskStatus (non-pending)", statuses.length, await count(target, "TaskStatus")],
    ["Note (non-empty)", notes.length, await count(target, "Note")],
    ["ActivityLog", logs.length, await count(target, "ActivityLog")],
    ["Settings", settings.length, await count(target, "Settings")],
    ["UserAchievement", unlocked.length, await count(target, "UserAchievement")],
  ];
  console.table(checks.map(([table, sourceRows, targetRows]) => ({ table, sourceRows, targetRows, match: sourceRows === targetRows })));
  if (checks.some(([, s, t]) => s !== t)) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  });
