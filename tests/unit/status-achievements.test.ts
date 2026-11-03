import { describe, expect, it } from "vitest";
import { isStatus, nextStatus } from "@/lib/status";
import { ACHIEVEMENT_DEFINITIONS, earnedAchievementKeys } from "@/lib/achievements";

describe("status", () => {
  it("cycles Pending, Completed, Failed, Missed", () => {
    expect(nextStatus("PENDING")).toBe("COMPLETED");
    expect(nextStatus("COMPLETED")).toBe("FAILED");
    expect(nextStatus("FAILED")).toBe("MISSED");
    expect(nextStatus("MISSED")).toBe("PENDING");
    expect(isStatus("DONE")).toBe(false);
  });
});

describe("achievements", () => {
  it("earns nothing with no activity", () => {
    expect(earnedAchievementKeys({ totalCompleted: 0, currentStreak: 0, longestStreak: 0, perfectDays: 0 })).toEqual([]);
  });

  it("unlocks first step, perfect day and a flawless week", () => {
    const keys = earnedAchievementKeys({ totalCompleted: 7, currentStreak: 3, longestStreak: 7, perfectDays: 7 });
    expect(keys).toEqual(expect.arrayContaining(["first_step", "streak_3", "perfect_day", "perfect_week"]));
    expect(keys).not.toContain("streak_7");
  });

  it("uses unique keys and icon names, not emojis", () => {
    const keys = ACHIEVEMENT_DEFINITIONS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const d of ACHIEVEMENT_DEFINITIONS) expect(d.icon).toMatch(/^[a-z-]+$/);
  });
});
