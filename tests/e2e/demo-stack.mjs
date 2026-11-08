/**
 * Demo stack for design review: the e2e stack plus realistic demo data
 * for e2e-user-0 (six habits, five weeks of mixed statuses, notes).
 * Usage: node tests/e2e/demo-stack.mjs  (same env as the e2e webServer).
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const DB_PORT = Number(process.env.E2E_DB_PORT ?? 54329);
const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);

const db = await PGlite.create();
const server = new PGLiteSocketServer({ db, port: DB_PORT, host: "127.0.0.1" });
await server.start();

function run(cmd) {
  return new Promise((resolve) => {
    spawn(cmd, { shell: true, stdio: "inherit", env: process.env }).on("exit", (code) => {
      if (code !== 0) {
        console.error(`[demo] failed: ${cmd}`);
        process.exit(1);
      }
      resolve();
    });
  });
}

await run("npx prisma migrate deploy");
await run("npx tsx prisma/seed.ts");

const iso = (d) => d.toISOString().slice(0, 10);
const day = (ago) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ago);
  return iso(d);
};

const habits = [
  ["tsleep", "Sleep by 11pm", "#10b981", 90],
  ["trun", "Running", "#84cc16", 90],
  ["tread", "Reasoning drills", "#6366f1", 60],
  ["taloe", "Alovera", "#22c55e", 60],
  ["tex", "Exercise", "#8b5cf6", 35],
  ["tmath", "Math", "#14b8a6", 20],
];
const lines = [
  `INSERT INTO "User" ("id","email","name","emailVerified","createdAt","updatedAt") VALUES ('e2e-user-0','e2e-0@example.test','Test Watcher 0',NOW(),NOW(),NOW());`,
  ...habits.map(
    ([id, name, color, age], i) =>
      `INSERT INTO "Task" ("id","userId","name","color","order","startDate","createdAt","updatedAt") VALUES ('${id}','e2e-user-0','${name}','${color}',${i},'${day(age)}',NOW(),NOW());`
  ),
];
// Deterministic mixed history: mostly completed, some failed/missed, today pending.
let n = 0;
for (const [id, , , age] of habits) {
  for (let ago = 1; ago <= age; ago++) {
    const r = (n * 7919 + ago * 104729 + id.length * 31) % 10;
    const status = r < 6 ? "COMPLETED" : r < 7 ? "FAILED" : r < 8 ? "MISSED" : null;
    if (status) {
      lines.push(
        `INSERT INTO "TaskStatus" ("id","taskId","date","status","updatedAt") VALUES ('s${id}${ago}','${id}','${day(ago)}','${status}',NOW());`
      );
    }
  }
  n++;
}
lines.push(
  `INSERT INTO "Note" ("id","userId","date","content","createdAt","updatedAt") VALUES ('n1','e2e-user-0','${day(1)}','Slept early, easy 5k. Evidence stacking up.',NOW(),NOW());`
);

const sqlFile = join(tmpdir(), `gw-demo-${process.pid}.sql`);
writeFileSync(sqlFile, lines.join("\n"));
await run(`npx prisma db execute --schema prisma/schema.prisma --file "${sqlFile}"`);

const app = spawn(`npx next dev -p ${APP_PORT}`, { shell: true, stdio: "inherit", env: process.env });
const stop = async () => {
  app.kill();
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
