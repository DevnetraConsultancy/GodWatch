import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

async function addHabit(page: Page, name: string) {
  await page.getByLabel("New habit name").fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: new RegExp(name) })).toBeVisible();
}

function todayCell(page: Page, habit: string) {
  return page.getByRole("gridcell").getByRole("button", { name: new RegExp(`^${habit}, .*: `) }).first();
}

test.describe("signed-in app", () => {
  test("empty dashboard invites the first habit", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add your first habit" })).toBeVisible();
  });

  test("validates habit names on the client", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.locator("#new-habit-error")).toHaveText("Give the habit a name");
  });

  test("add a habit, cycle a cell, undo, and persist", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await addHabit(page, "Read");

    const cell = todayCell(page, "Read");
    await expect(cell).toHaveAccessibleName(/Pending$/);
    await cell.click();
    await expect(cell).toHaveAccessibleName(/Completed$/);
    await expect(page.getByText("1 of 1 done")).toBeVisible();

    await cell.click();
    await expect(cell).toHaveAccessibleName(/Failed$/);

    // Undo from the toast puts it back to Completed.
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(cell).toHaveAccessibleName(/Completed$/);
    await expect(page.getByText("Change undone")).toBeVisible();

    await page.reload();
    await expect(todayCell(page, "Read")).toHaveAccessibleName(/Completed$/);
  });

  test("first completion unlocks a badge shown on the profile", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await addHabit(page, "Meditate");
    await todayCell(page, "Meditate").click();
    await expect(page.getByText("Badge unlocked: First Step")).toBeVisible();
    await page.goto("/profile");
    await expect(page.getByText(/Unlocked .*20\d\d/).first()).toBeVisible();
  });

  test("notes autosave and are searchable", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await addHabit(page, "Journal");
    await page.getByRole("button", { name: /^Add note for / }).first().click();
    await page.getByRole("textbox", { name: /^Note for / }).fill("Felt great after the morning walk");
    await expect(page.getByText("Saved")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /^Open note for / }).first()).toBeVisible();

    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("combobox", { name: "Search" }).fill("morning walk");
    await expect(page.getByRole("option", { name: /morning walk/ })).toBeVisible();
  });

  test("rename, recolour, archive and restore a habit", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await addHabit(page, "Stretch");
    await page.getByRole("button", { name: "Options for Stretch" }).click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    const input = page.getByRole("textbox", { name: "Rename Stretch" });
    await input.fill("Stretch 10 min");
    await input.press("Enter");
    await expect(page.getByRole("columnheader", { name: /Stretch 10 min/ })).toBeVisible();

    await page.getByRole("button", { name: "Options for Stretch 10 min" }).click();
    await page.getByRole("menuitem", { name: "Emerald" }).click();

    await page.getByRole("button", { name: "Options for Stretch 10 min" }).click();
    await page.getByRole("menuitem", { name: "Archive" }).click();
    await expect(page.getByText("Archived Stretch 10 min")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add your first habit" })).toBeVisible();

    await page.goto("/settings");
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("Restored Stretch 10 min")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByRole("columnheader", { name: /Stretch 10 min/ })).toBeVisible();
  });

  test("delete asks for confirmation", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await addHabit(page, "Temp");
    await page.getByRole("button", { name: "Options for Temp" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("permanently deletes");
    await page.getByRole("button", { name: "Delete forever" }).click();
    await expect(page.getByText("Deleted Temp")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Temp/ })).toHaveCount(0);
  });

  test("export downloads only this user's data", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await addHabit(page, "=CMD()");
    await todayCell(page, "=CMD\\(\\)").click();
    await page.goto("/settings");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const file = await download;
    const csv = await (await file.createReadStream()).toArray();
    const text = Buffer.concat(csv).toString("utf8");
    expect(text.split("\r\n")[0]).toBe("Date,Task,Status");
    // Formula injection is neutralised.
    expect(text).toContain("'=CMD()");
    expect(text).toContain("Completed");
    expect(text).not.toContain("Read");
  });

  test("settings save and analytics render", async ({ page, userId }) => {
    void userId;
    await page.goto("/settings");
    await page.getByRole("radio", { name: "Emerald" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();

    await page.goto("/dashboard");
    await addHabit(page, "Water");
    await todayCell(page, "Water").click();
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByText("Year at a glance")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Water" })).toBeVisible();
  });

  test("signed-in pages have no serious accessibility violations", async ({ page, userId }) => {
    void userId;
    await page.goto("/dashboard");
    await addHabit(page, "Focus");
    for (const path of ["/dashboard", "/analytics", "/profile", "/settings"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .exclude(".recharts-wrapper")
        .analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious, `${path}: ${JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target).slice(0, 3) })), null, 2)}`).toEqual([]);
    }
  });
});
