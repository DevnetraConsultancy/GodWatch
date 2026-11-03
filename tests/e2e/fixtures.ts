import { test as base, expect, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { E2E_AUTH_SECRET } from "../../playwright.config";

const COOKIE = "authjs.session-token";
// Desktop tests use users 0-29, mobile tests 30-39, so projects never share data.
const counters: Record<string, number> = {};

/** Sign the page in as a pre-created test user (no Google round-trip). */
export async function signInAs(page: Page, index: number): Promise<string> {
  const id = `e2e-user-${index}`;
  const token = await encode({
    token: { sub: id, uid: id, email: `e2e-${index}@example.test`, name: `Test Watcher ${index}` },
    secret: E2E_AUTH_SECRET,
    salt: COOKIE,
  });
  await page.context().addCookies([
    { name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
  return id;
}

/** Each test gets its own fresh user, so tests never share data. */
export const test = base.extend<{ userId: string }>({
  userId: async ({ page }, use, info) => {
    const project = info.project.name;
    const n = (counters[project] = (counters[project] ?? -1) + 1);
    const index = project === "mobile" ? 30 + (n % 10) : n % 30;
    await use(await signInAs(page, index));
  },
});

export { expect };
