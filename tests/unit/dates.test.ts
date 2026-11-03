import { describe, expect, it } from "vitest";
import {
  addDays,
  dateInZone,
  dateRange,
  daysBetween,
  formatDate,
  isISODate,
  isValidTimeZone,
  todayInZone,
} from "@/lib/dates";

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isISODate("2024-02-29")).toBe(true);
    expect(isISODate("2023-02-29")).toBe(false);
    expect(isISODate("2024-13-01")).toBe(false);
    expect(isISODate("2024-1-01")).toBe(false);
  });

  it("recognises IANA timezones", () => {
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("returns the local calendar date for an instant", () => {
    // 20:00 UTC on 1 Jan is already 2 Jan in India and still 1 Jan in New York.
    const instant = new Date("2025-01-01T20:00:00Z");
    expect(dateInZone(instant, "Asia/Kolkata")).toBe("2025-01-02");
    expect(dateInZone(instant, "America/New_York")).toBe("2025-01-01");
    expect(dateInZone(instant, "UTC")).toBe("2025-01-01");
  });

  it("falls back to UTC for an unknown timezone", () => {
    expect(todayInZone("Nope/Nope", new Date("2025-06-01T23:30:00Z"))).toBe("2025-06-01");
  });

  it("does day arithmetic across month, year and DST boundaries", () => {
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addDays("2025-03-30", 1)).toBe("2025-03-31");
    expect(daysBetween("2025-01-01", "2025-03-01")).toBe(59);
    expect(daysBetween("2025-03-01", "2025-01-01")).toBe(-59);
  });

  it("builds inclusive ranges", () => {
    expect(dateRange("2025-01-30", "2025-02-02")).toEqual([
      "2025-01-30",
      "2025-01-31",
      "2025-02-01",
      "2025-02-02",
    ]);
    expect(dateRange("2025-02-02", "2025-01-30")).toEqual([]);
  });

  it("formats without shifting the day", () => {
    expect(formatDate("2025-01-05")).toBe("Jan 5");
  });
});
