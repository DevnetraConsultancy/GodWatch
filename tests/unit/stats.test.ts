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

  it("counts active slots for window rates, except today's unmarked ones", () => {
    // Four active slots this week, but b has not been marked today yet.
    expect(s.windows.weekly).toEqual({ completed: 2, slots: 3, rate: 67 });
  });

  it("finds best and worst month by completion rate", () => {
    const multi = computeHabitStats(
      [habit("a", "2025-02-27")],
      [done("a", "2025-02-27"), done("a", "2025-02-28"), done("a", "2025-03-01")],
      TODAY
    );
    expect(multi.bestMonth).toEqual({ month: "2025-02", rate: 100 });
    // March has ten days up to today, but today's unmarked slot is not held against you yet.
    expect(multi.worstMonth).toEqual({ month: "2025-03", rate: 11 });
  });

  it("does not let an unfinished today lower the window or month rates", () => {
    const flawless = computeHabitStats(
      [habit("a", "2025-03-08"), habit("b", "2025-03-08")],
      [done("a", "2025-03-08"), done("b", "2025-03-08"), done("a", "2025-03-09"), done("b", "2025-03-09"), done("a", TODAY)],
      TODAY
    );
    // b is simply not done yet today: 5 of 5 marked cells are complete.
    expect(flawless.windows.weekly).toEqual({ completed: 5, slots: 5, rate: 100 });
    expect(flawless.worstMonth).toEqual({ month: "2025-03", rate: 100 });
    // Today's own rate still counts everything due today.
    expect(flawless.windows.daily).toEqual({ completed: 1, slots: 2, rate: 50 });

    // A Failed today does count against the rate.
    const failed = computeHabitStats(
      [habit("a", "2025-03-09")],
      [done("a", "2025-03-09"), { taskId: "a", date: TODAY, status: "FAILED" }],
      TODAY
    );
    expect(failed.windows.weekly).toEqual({ completed: 1, slots: 2, rate: 50 });
  });

  it("keeps archive-and-restore gaps out of the record", () => {
    // a ran 03-01..03-05, was archived on 03-06 and restored on 03-10 (today).
    const a: HabitSpan = { id: "a", startDate: "2025-03-01", archivedOn: null, pauses: [{ from: "2025-03-06", to: TODAY }] };
    const b = habit("b", "2025-03-06");
    const cells = [
      ...["01", "02", "03", "04", "05"].map((d) => done("a", `2025-03-${d}`)),
      ...["06", "07", "08", "09"].map((d) => done("b", `2025-03-${d}`)),
    ];
    const s = computeHabitStats([a, b], cells, TODAY);
    // Nine perfect days in a row; the gap never adds an unmarked slot for a.
    expect(s.longestStreak).toBe(9);
    expect(s.currentStreak).toBe(9);
    expect(s.totals.unmarked).toBe(2); // only today's two pending cells
    expect(scoreDays([a, b], cells, TODAY).find((d) => d.date === "2025-03-07")).toMatchObject({ active: 1, completed: 1 });
    // On the restore day the habit counts again.
    expect(scoreDays([a, b], cells, TODAY).at(-1)).toMatchObject({ date: TODAY, active: 2 });
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
