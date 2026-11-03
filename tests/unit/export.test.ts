import { describe, expect, it } from "vitest";
import { buildExportRows, csvField, toCSV } from "@/lib/export";

describe("export", () => {
  it("neutralises spreadsheet formulas", () => {
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvField("+1")).toBe("'+1");
    expect(csvField("-cmd")).toBe("'-cmd");
    expect(csvField("@SUM")).toBe("'@SUM");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvField("Read, write")).toBe('"Read, write"');
    expect(csvField("plain")).toBe("plain");
  });

  it("exports only active days, newest first", () => {
    const rows = buildExportRows(
      [{ id: "a", name: "Read", startDate: "2025-03-09", archivedOn: null }],
      [{ taskId: "a", date: "2025-03-09", status: "COMPLETED" }],
      "2025-03-10",
      5
    );
    expect(rows).toEqual([
      { date: "2025-03-10", task: "Read", status: "Pending" },
      { date: "2025-03-09", task: "Read", status: "Completed" },
    ]);
    expect(toCSV(rows)).toBe("Date,Task,Status\r\n2025-03-10,Read,Pending\r\n2025-03-09,Read,Completed\r\n");
  });
});
