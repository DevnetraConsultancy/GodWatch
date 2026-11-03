/**
 * E2E stack: in-memory Postgres (PGlite) -> migrations -> seed -> test users -> Next.js.
 * PGlite allows one connection at a time, so every setup step runs and
 * disconnects before the app server starts. Never touches a real database.
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const DB_PORT = Number(process.env.E2E_DB_PORT ?? 54329);
const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
const USERS = Number(process.env.E2E_USERS ?? 40);

const db = await PGlite.create();
const server = new PGLiteSocketServer({ db, port: DB_PORT, host: "127.0.0.1" });
await server.start();

// Async on purpose: the database runs in this process, so the event loop must stay free.
function run(cmd) {
  return new Promise((resolve) => {
    spawn(cmd, { shell: true, stdio: "inherit", env: process.env }).on("exit", (code) => {
      if (code !== 0) {
        console.error(`[e2e] failed: ${cmd}`);
        process.exit(1);
      }
      resolve();
    });
  });
}

await run("npx prisma migrate deploy");
await run("npx tsx prisma/seed.ts");

// Fixed test users: e2e-user-0 ... e2e-user-N. Tests mint session cookies for them.
const values = Array.from({ length: USERS }, (_, i) => `('e2e-user-${i}', 'e2e-${i}@example.test', 'Test Watcher ${i}', NOW(), NOW(), NOW())`).join(",");
const sqlFile = join(tmpdir(), `gw-e2e-users-${process.pid}.sql`);
writeFileSync(sqlFile, `INSERT INTO "User" ("id","email","name","emailVerified","createdAt","updatedAt") VALUES ${values};`);
await run(`npx prisma db execute --schema prisma/schema.prisma --file "${sqlFile}"`);

const command = process.env.E2E_PROD ? `npx next start -p ${APP_PORT}` : `npx next dev -p ${APP_PORT}`;
const app = spawn(command, { shell: true, stdio: "inherit", env: process.env });
const stop = async () => {
  app.kill();
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
app.on("exit", (code) => process.exit(code ?? 0));
