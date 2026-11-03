import { describe, expect, it } from "vitest";
import {
  noteUpdateSchema,
  settingsUpdateSchema,
  statusUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  timeZoneSchema,
} from "@/lib/validation";

describe("validation", () => {
  it("validates habit names", () => {
    expect(taskCreateSchema.safeParse({ name: " Reading " }).data?.name).toBe("Reading");
    expect(taskCreateSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(taskCreateSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });

  it("only allows palette colours", () => {
    expect(taskCreateSchema.safeParse({ name: "A", color: "#6366f1" }).success).toBe(true);
    expect(taskCreateSchema.safeParse({ name: "A", color: "#123456" }).success).toBe(false);
  });

  it("requires at least one field on update", () => {
    expect(taskUpdateSchema.safeParse({ taskId: "abc" }).success).toBe(false);
    expect(taskUpdateSchema.safeParse({ taskId: "abc", archived: true }).success).toBe(true);
  });

  it("rejects malformed ids, dates and statuses", () => {
    const ok = { taskId: "cm1abc", date: "2025-03-10", status: "COMPLETED" };
    expect(statusUpdateSchema.safeParse(ok).success).toBe(true);
    expect(statusUpdateSchema.safeParse({ ...ok, taskId: "a' OR 1=1" }).success).toBe(false);
    expect(statusUpdateSchema.safeParse({ ...ok, date: "2025-02-30" }).success).toBe(false);
    expect(statusUpdateSchema.safeParse({ ...ok, status: "DONE" }).success).toBe(false);
  });

  it("caps note length", () => {
    expect(noteUpdateSchema.safeParse({ date: "2025-03-10", content: "x".repeat(10_001) }).success).toBe(false);
  });

  it("validates settings and timezones", () => {
    const ok = { dailyReminderEnabled: true, dailyReminderTime: "07:30", defaultTaskColor: "#10b981" };
    expect(settingsUpdateSchema.safeParse(ok).success).toBe(true);
    expect(settingsUpdateSchema.safeParse({ ...ok, dailyReminderTime: "25:00" }).success).toBe(false);
    expect(timeZoneSchema.safeParse("Europe/London").success).toBe(true);
    expect(timeZoneSchema.safeParse("Not/AZone").success).toBe(false);
  });
});
