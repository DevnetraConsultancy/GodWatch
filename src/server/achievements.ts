import "server-only";
import { prisma } from "@/server/db";
import { getHabitHistory } from "@/server/data";
import { logActivity } from "@/server/activity";
import { ACHIEVEMENT_DEFINITIONS, earnedAchievementKeys } from "@/lib/achievements";
import { computeHabitStats } from "@/lib/stats";
import type { ISODate } from "@/lib/dates";
import type { UnlockedAchievement } from "@/types/dto";

/** Make sure every badge definition exists in the database (idempotent). */
async function ensureDefinitions(keys: string[]): Promise<Map<string, string>> {
  const existing = await prisma.achievement.findMany({ where: { key: { in: keys } }, select: { id: true, key: true } });
  const ids = new Map(existing.map((a) => [a.key, a.id]));
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!keys.includes(def.key) || ids.has(def.key)) continue;
    const created = await prisma.achievement.upsert({
      where: { key: def.key },
      update: {},
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        criteria: { type: def.criteria.type, value: def.criteria.value },
      },
      select: { id: true },
    });
    ids.set(def.key, created.id);
  }
  return ids;
}

/**
 * Unlock any badges the user has newly earned. Badges are permanent once
 * unlocked. Returns the newly unlocked ones so the UI can celebrate them.
 */
export async function unlockAchievements(userId: string, today: ISODate): Promise<UnlockedAchievement[]> {
  const { tasks, cells } = await getHabitHistory(userId);
  const stats = computeHabitStats(tasks, cells, today);
  const earned = earnedAchievementKeys({
    totalCompleted: stats.totals.completed,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    perfectDays: stats.perfectDays,
  });
  if (earned.length === 0) return [];

  const already = await prisma.userAchievement.findMany({
    where: { userId, achievement: { key: { in: earned } } },
    select: { achievement: { select: { key: true } } },
  });
  const have = new Set(already.map((a) => a.achievement.key));
  const fresh = earned.filter((k) => !have.has(k));
  if (fresh.length === 0) return [];

  const ids = await ensureDefinitions(fresh);
  await prisma.userAchievement.createMany({
    data: fresh.map((key) => ({ userId, achievementId: ids.get(key)! })),
    skipDuplicates: true,
  });

  const unlocked = ACHIEVEMENT_DEFINITIONS.filter((d) => fresh.includes(d.key)).map((d) => ({ key: d.key, name: d.name }));
  for (const a of unlocked) await logActivity(userId, "ACHIEVEMENT_UNLOCKED", { key: a.key, name: a.name });
  return unlocked;
}
