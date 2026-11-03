import { test, expect } from "./fixtures";

const WIDTHS = [360, 768, 1280, 1920];

for (const width of WIDTHS) {
  test(`no horizontal page scroll at ${width}px`, async ({ page, userId }) => {
    void userId;
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/dashboard", "/analytics", "/profile", "/settings"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });
}
