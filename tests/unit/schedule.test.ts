import { describe, expect, it } from "vitest";
import {
  durationMinutes,
  formatTime,
  formatWindow,
  isOvernight,
  isTime,
  minutesOf,
  overlappingHabits,
  suggestedStart,
  weekdayOf,
  windowFor,
  windowsOverlap,
} from "@/lib/schedule";
import { weekTimesSchema } from "@/lib/validation";

describe("schedule", () => {
  it("validates clock times", () => {
    expect(isTime("00:00")).toBe(true);
    expect(isTime("23:59")).toBe(true);
    expect(isTime("24:00")).toBe(false);
    expect(isTime("9:00")).toBe(false);
    expect(isTime("09:60")).toBe(false);
  });

  it("formats times as compact 12-hour", () => {
    expect(formatTime("09:00")).toBe("9 AM");
    expect(formatTime("12:00")).toBe("12 PM");
    expect(formatTime("00:30")).toBe("12:30 AM");
    expect(formatTime("21:15")).toBe("9:15 PM");
    expect(formatWindow({ start: "10:00", end: "11:00" })).toBe("10 AM - 11 AM");
  });

  it("finds the weekday and window of a date", () => {
    expect(weekdayOf("2026-11-06")).toBe("5"); // a Friday
    const times = { "5": { start: "20:00", end: "21:00" } };
    expect(windowFor(times, "2026-11-06")).toEqual({ start: "20:00", end: "21:00" });
    expect(windowFor(times, "2026-11-07")).toBeNull();
    expect(windowFor(null, "2026-11-06")).toBeNull();
  });

  it("suggests the previous habit's end as the next start", () => {
    const a = { "1": { start: "19:00", end: "20:00" } };
    const b = { "2": { start: "06:00", end: "07:00" } };
    expect(suggestedStart([a, b], "1")).toBe("20:00");
    expect(suggestedStart([a, b], "2")).toBe("07:00");
    expect(suggestedStart([a, b], "3")).toBeNull();
    expect(suggestedStart([], "1")).toBeNull();
    expect(suggestedStart([null, a], "1")).toBe("20:00");
  });

  it("accepts overnight windows and rejects only zero-length ones", () => {
    expect(minutesOf("08:30")).toBe(510);
    expect(weekTimesSchema.safeParse({ "1": { start: "08:00", end: "09:00" } }).success).toBe(true);
    // "Sleep, 11 PM to 6 AM" runs past midnight and is valid.
    expect(weekTimesSchema.safeParse({ "1": { start: "23:00", end: "06:00" } }).success).toBe(true);
    expect(weekTimesSchema.safeParse({ "1": { start: "09:00", end: "09:00" } }).success).toBe(false);
    expect(weekTimesSchema.safeParse(null).success).toBe(true);
    // An empty object means "untimed" and normalises to null.
    expect(weekTimesSchema.parse({})).toBeNull();
    expect(weekTimesSchema.safeParse({ "7": { start: "08:00", end: "09:00" } }).success).toBe(false);
  });

  it("knows overnight windows and their length", () => {
    expect(isOvernight({ start: "23:00", end: "06:00" })).toBe(true);
    expect(isOvernight({ start: "09:00", end: "10:00" })).toBe(false);
    expect(durationMinutes({ start: "23:00", end: "06:00" })).toBe(7 * 60);
    expect(durationMinutes({ start: "09:00", end: "10:30" })).toBe(90);
    expect(formatWindow({ start: "23:00", end: "06:00" })).toBe("11 PM - 6 AM");
  });

  it("detects overlaps, including across midnight, as a warning only", () => {
    const sleep = { start: "23:00", end: "06:00" };
    expect(windowsOverlap(sleep, { start: "05:00", end: "07:00" })).toBe(true);
    expect(windowsOverlap(sleep, { start: "22:30", end: "23:30" })).toBe(true);
    expect(windowsOverlap(sleep, { start: "09:00", end: "10:00" })).toBe(false);
    // Touching ends do not overlap.
    expect(windowsOverlap({ start: "09:00", end: "10:00" }, { start: "10:00", end: "11:00" })).toBe(false);
    expect(windowsOverlap({ start: "09:00", end: "11:00" }, { start: "10:00", end: "12:00" })).toBe(true);

    const others = [
      { name: "Workout", times: { "1": { start: "05:30", end: "06:30" } } },
      { name: "Read", times: { "1": { start: "21:00", end: "22:00" } } },
      { name: "Untimed", times: null },
    ];
    expect(overlappingHabits(sleep, "1", others).map((t) => t.name)).toEqual(["Workout"]);
    expect(overlappingHabits(sleep, "2", others)).toEqual([]);
  });
});
