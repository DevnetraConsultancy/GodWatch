import { describe, expect, it } from "vitest";
import { formatTime, formatWindow, isTime, minutesOf, suggestedStart, weekdayOf, windowFor } from "@/lib/schedule";
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

  it("orders minutes and rejects inverted windows", () => {
    expect(minutesOf("08:30")).toBe(510);
    expect(weekTimesSchema.safeParse({ "1": { start: "08:00", end: "09:00" } }).success).toBe(true);
    expect(weekTimesSchema.safeParse({ "1": { start: "09:00", end: "08:00" } }).success).toBe(false);
    expect(weekTimesSchema.safeParse(null).success).toBe(true);
    // An empty object means "untimed" and normalises to null.
    expect(weekTimesSchema.parse({})).toBeNull();
    expect(weekTimesSchema.safeParse({ "7": { start: "08:00", end: "09:00" } }).success).toBe(false);
  });
});
