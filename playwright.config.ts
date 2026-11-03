import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a real Next.js server and a throwaway
 * in-memory Postgres (PGlite), started by tests/e2e/start-stack.mjs.
 * They never touch a real database. Sessions are minted with a test-only
 * AUTH_SECRET for pre-created test users (see tests/e2e/fixtures.ts).
 */
const PORT = 3100;
const DB_URL = "postgresql://postgres:postgres@127.0.0.1:54329/postgres?sslmode=disable&connection_limit=1&pgbouncer=true";
export const E2E_AUTH_SECRET = "e2e-only-secret-not-used-anywhere-else-0123456789";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /(public|responsive)\.spec\.ts/ },
  ],
  webServer: {
    command: "node tests/e2e/start-stack.mjs",
    url: `http://localhost:${PORT}/offline`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATABASE_URL: DB_URL,
      DIRECT_URL: DB_URL,
      AUTH_SECRET: E2E_AUTH_SECRET,
      AUTH_URL: `http://localhost:${PORT}`,
      AUTH_TRUST_HOST: "true",
      GOOGLE_CLIENT_ID: "e2e-client-id",
      GOOGLE_CLIENT_SECRET: "e2e-client-secret",
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
    },
  },
});
