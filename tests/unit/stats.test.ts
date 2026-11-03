import { describe, expect, it } from "vitest";
import {
  computeHabitStats,
  computeStreaks,
  computeTaskPerformance,
  dailySeries,
  scoreDays,
  type Cell,
  type HabitSpan,
} from "@/lib/stats";

const TODAY = "2025-03-10";
const habit = (id: string, startDate: string, archivedOn: string | null = null): HabitSpan => ({
  id,
  startDate,
  archivedOn,
});
const done = (taskId: string, date: string): Cell => ({ taskId, date, status: "COMPLETED" });

describe("scoreDays", () => {
  it("only counts a habit from its start date", () => {
    const days = scoreDays([habit("a", "2025-03-08"), habit("b", "2025-03-10")], [], TODAY);
    expect(days.map((d) => [d.date, d.active])).toEqual([
      ["2025-03-08", 1],
      ["2025-03-09", 1],
      ["2025-03-10", 2],
    ]);
  });

  it("stops counting a habit from the day it was archived", () => {
    const days = scoreDays([habit("a", "2025-03-08", "2025-03-10")], [], TODAY);
    expect(days.at(-1)).toMatchObject({ date: TODAY, active: 0 });
    expect(days[0]).toMatchObject({ active: 1 });
  });

  it("treats a back-filled day as the habit's start", () => {
    const days = scoreDays([habit("a", "2025-03-10")], [done("a", "2025-03-07")], TODAY);
    expect(days[0]).toMatchObject({ date: "2025-03-07", active: 1, completed: 1 });
  });

  it("ignores cells after today", () => {
    const days = scoreDays([habit("a", "2025-03-10")], [done("a", "2025-03-11")], TODAY);
    expect(days.map((d) => d.date)).toEqual([TODAY]);
  });
});

describe("streaks", () => {
  it("is zero with no habits", () => {
    expect(computeStreaks([])).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("keeps the streak alive while today is unfinished", () => {
    const cells = [done("a", "2025-03-07"), done("a", "2025-03-08"), done("a", "2025-03-09")];
    const s = computeHabitStats([habit("a", "2025-03-07")], cells, TODAY);
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it("counts today once it is perfect", () => {
    const s = computeHabitStats([habit("a", "2025-03-09")], [done("a", "2025-03-09"), done("a", TODAY)], TODAY);
    expect(s.currentStreak).toBe(2);
  });

  it("breaks on an imperfect day", () => {
    const cells = [
      done("a", "2025-03-05"),
      done("a", "2025-03-06"),
      done("a", "2025-03-07"),
      done("a", "2025-03-09"),
    ];
    const s = computeHabitStats([habit("a", "2025-03-05")], cells, TODAY);
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(3);
  });

  it("does not let a new habit rewrite past perfect days", () => {
    const cells = [done("a", "2025-03-08"), done("a", "2025-03-09")];
    const before = computeHabitStats([habit("a", "2025-03-08")], cells, TODAY);
    const after = computeHabitStats([habit("a", "2025-03-08"), habit("b", TODAY)], cells, TODAY);
    expect(after.currentStreak).toBe(before.currentStreak);
    expect(after.longestStreak).toBe(2);
  });

  it("does not count days with no active habits as perfect", () => {
    const s = computeHabitStats([habit("a", "2025-03-08", "2025-03-09")], [done("a", "2025-03-08")], TODAY);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(1);
  });
});

describe("computeHabitStats", () => {
  const habits = [habit("a", "2025-03-09"), habit("b", "2025-03-09")];
  const cells: Cell[] = [
    done("a", "2025-03-09"),
    { taskId: "b", date: "2025-03-09", status: "FAILED" },
    done("a", TODAY),
  ];
  const s = computeHabitStats(habits, cells, TODAY);

  it("totals marked and unmarked cells over active days", () => {
    expect(s.totals).toEqual({ completed: 2, failed: 1, missed: 0, unmarked: 1, checked: 3 });
    expect(s.lifetimeCompletion).toBe(67);
  });

  it("scores today", () => {
    expect(s.today).toMatchObject({ active: 2, completed: 1 });
    expect(s.windows.daily.rate).toBe(50);
  });

  it("uses active slots for window rates", () => {
    expect(s.windows.weekly).toEqual({ completed: 2, slots: 4, rate: 50 });
  });

  it("finds best and worst month by completion rate", () => {
    const multi = computeHabitStats(
      [habit("a", "2025-02-27")],
      [done("a", "2025-02-27"), done("a", "2025-02-28"), done("a", "2025-03-01")],
      TODAY
    );
    expect(multi.bestMonth).toEqual({ month: "2025-02", rate: 100 });
    expect(multi.worstMonth).toEqual({ month: "2025-03", rate: 10 });
  });

  it("returns an empty today when there are no habits", () => {
    const empty = computeHabitStats([], [], TODAY);
    expect(empty.today).toMatchObject({ date: TODAY, active: 0 });
    expect(empty.bestMonth).toBeNull();
  });
});

describe("series and performance", () => {
  it("produces exactly N days ending today", () => {
    const series = dailySeries([habit("a", TODAY)], [done("a", TODAY)], TODAY, 7);
    expect(series).toHaveLength(7);
    expect(series.at(-1)).toMatchObject({ date: TODAY, rate: 100 });
    expect(series[0]).toMatchObject({ active: 0, rate: 0 });
  });

  it("rates each habit over its own active days", () => {
    const perf = computeTaskPerformance(
      [habit("a", "2025-03-09"), habit("b", TODAY)],
      [done("a", "2025-03-09"), done("b", TODAY)],
      TODAY
    );
    expect(perf[0]).toMatchObject({ activeDays: 2, completed: 1, unmarked: 1, rate: 50 });
    expect(perf[1]).toMatchObject({ activeDays: 1, completed: 1, rate: 100 });
  });
});
