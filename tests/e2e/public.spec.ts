import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("public pages", () => {
  test("landing page renders and links to sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/GodWatch/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Leave evidence");
    await expect(page.getByText("Devnetra Consultancy", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Start tracking free" }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page shows Google sign-in and friendly errors", async ({ page }) => {
    await page.goto("/login?error=AccessDenied");
    await expect(page.getByRole("heading", { name: /sign in to god watch/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByText(/verified email/)).toBeVisible();
  });

  test("protected pages redirect to login with a callback", async ({ page }) => {
    for (const path of ["/dashboard", "/analytics", "/profile", "/settings"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?callbackUrl=${encodeURIComponent(path)}`));
    }
  });

  test("security headers and CSP nonce are present", async ({ page }) => {
    const res = await page.goto("/");
    const headers = res!.headers();
    expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("export API rejects anonymous requests", async ({ request }) => {
    const res = await request.get("/api/export?format=csv");
    expect(res.status()).toBe(401);
  });

  test("robots and sitemap are served", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /dashboard");
    expect(await (await request.get("/sitemap.xml")).text()).toContain("<urlset");
  });

  test("landing and login have no serious accessibility violations", async ({ page }) => {
    for (const path of ["/", "/login"]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), null, 2)).toEqual([]);
    }
  });

  test("no emoji characters on public pages", async ({ page }) => {
    for (const path of ["/", "/login"]) {
      await page.goto(path);
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});

test("push cron endpoint rejects calls without the secret", async ({ request }) => {
  const res = await request.get("/api/push/cron");
  expect(res.status()).toBe(401);
});
