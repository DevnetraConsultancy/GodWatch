# God Watch

**Every Day Leaves Evidence.** A date-first habit tracker: each day is a row, each habit a column, and every cell is Pending, Completed, Failed or Missed.

Built with Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Prisma with Neon Postgres, and Auth.js v5 (Google sign-in only).

## Features

- **Grid**: today on top, 90 days by default with "Show earlier days". One tap or click cycles a cell and saves instantly, with an Undo toast.
- **Touch-first**: everything works with taps and clicks alone; no keyboard shortcuts to learn.
- **Habits**: add, rename, recolour, reorder (drag or menu), archive and restore, delete with confirmation.
- **Notes**: one autosaving note per day, searchable.
- **Analytics**: today / 7 / 30 / 365-day rates, current and longest streak, best and toughest month, 30-day trend, year heatmap, per-habit breakdown.
- **Badges**: unlocked automatically and kept once earned.
- **Reminders**: optional browser notification at a chosen time (works while the app is open or installed).
- **Export**: last 365 days as CSV or PDF.

### How days and streaks are counted ("fair history")

- "Today" is the user's own day in their timezone, detected from the browser and stored in Settings.
- A habit counts from the day it was created (or the earliest day you back-filled for it) until the day it was archived.
- A day is *perfect* when it has at least one active habit and every active habit is Completed. Streaks count consecutive perfect days; an unfinished today never breaks the current streak.
- Adding a habit never changes how past days score.

The engine is pure and unit-tested: `src/lib/stats.ts`, `src/lib/dates.ts`.

## Project structure

```
src/
  app/            routes: landing, (auth)/login, (app)/dashboard|analytics|profile|settings, api/
  components/ui/  design system (buttons, fields, cards, dialogs, menus, tabs, tooltips, tables, states)
  features/       grid, analytics, profile, settings, search, shell, reminders, landing, pwa
  server/         auth, database, session, rate limiting, data access, server actions (server-only)
  lib/            pure logic: dates, stats, status, achievements, export, validation
prisma/           schema, migrations, seed, one-off Supabase copy script
tests/unit        Vitest
tests/e2e         Playwright (runs against a throwaway in-memory Postgres)
```

## Getting started

```bash
npm install
cp .env.example .env        # fill in the values
npx prisma migrate deploy   # create tables
npm run db:seed             # badge definitions
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Prisma generate + production build |
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests (starts its own app and database) |
| `npm run check` | Type check, lint, unit tests and build |
| `npm run db:migrate` | Create a new migration in development |
| `npm run db:deploy` | Apply migrations (production) |

Set `E2E_PROD=1` to run the e2e suite against `next start` (run `npm run build` first).

## Security

- Google sign-in only, verified emails only. Sessions are JWTs; every request re-checks the user exists in the database.
- Every query is scoped to the signed-in user's id from the session, never from client input.
- All inputs are validated with Zod on the server (and on the client for fast feedback).
- Rate limits on every server action, sign-in and export, stored in Postgres so they hold across serverless instances.
- Per-request nonce Content-Security-Policy, plus HSTS, frame, content-type, referrer and permissions headers.
- Server Actions enforce same-origin requests (CSRF). Post-login redirects accept same-origin paths only.
- CSV export neutralises spreadsheet formulas.
- The service worker caches public static files only; signed-in pages and API responses are never cached.

## Deployment (Vercel + Neon)

1. Create a Neon project; copy the pooled and direct connection strings.
2. Set the environment variables from `.env.example` in Vercel.
3. Vercel runs `prisma migrate deploy && npm run build` (see `vercel.json`).
4. Add `{your domain}/api/auth/callback/google` as an authorised redirect URI in Google Cloud Console.

## Author

**Devnetra Consultancy** · [dr.neeconnect@gmail.com](mailto:dr.neeconnect@gmail.com)

Invented by Devnetra Consultancy.
