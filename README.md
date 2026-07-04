# Choreboard

Shared daily/weekly chore planner for a two-person household. Real-time sync between
two accounts. Tasks "reset" by date/week-keyed completions (never destructive).

## Stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS
- lucide-react icons + Next.js font loading
- Supabase (Postgres + Auth + Realtime), email/password auth
- Deploy target: Railway
- PWA (installable to home screen)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable                        | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (e.g. `https://xxxx.supabase.co`).                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (safe in the browser; RLS protects data).      |
| `ALLOWED_EMAILS`                | Comma-separated allow-list of emails permitted to sign in (the two members). |

Secrets are only ever read from the environment — never commit `.env*`.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build (must pass)
- `npm test` — unit tests (Vitest)
- `npm run lint` — lint (must pass with no errors)

## Project layout

```
src/
  app/                 # Next.js App Router pages + layout
  lib/
    env.ts             # typed env-var access + email allow-list
    database.types.ts  # hand-written DB types (kept in sync with SQL)
    supabase/          # browser/server/middleware Supabase clients
public/
  manifest.json        # PWA manifest
  icons/               # PWA icons (192, 512)
```

## PWA

`public/manifest.json` plus `public/icons/icon-192.png` and `icon-512.png` make the app
installable to the home screen on iOS and desktop. It runs standalone once installed.

## Changelog

- **Slice 1 — Scaffold:** Next.js 14 + TS (strict) + Tailwind, Supabase browser/server/middleware
  clients, typed env wiring, PWA manifest + icons. `npm run build`, `npm run lint`, `npm test` pass.
- **Slice 2 — Data + helper:** SQL migration `supabase/migrations/0001_init.sql`
  (`profiles`, `tasks`, `completions` with RLS on all three + realtime publication).
  `getWeekStart` week helper in `src/lib/week.ts` with unit tests in `src/lib/week.test.ts`
  (mid-week, Sunday, Monday, and DST changeover cases).

### Database setup

Run the migrations against your Supabase project (SQL editor or CLI):

```bash
# Supabase CLI
supabase db push
# or paste supabase/migrations/0001_init.sql and 0002_daily_schedule.sql
# into the Supabase SQL editor in order
```

In the Supabase dashboard, enable email/password auth. If you do not want any
account-creation email at all, turn off Auth → Providers → Email → "Confirm email".
Keep the Auth → URL configuration "Site URL" / redirect allow-list set to include
`<your-app-url>/auth/callback` for any Supabase confirmation/recovery flows you choose
to keep enabled.

- **Slice 3 — Auth:** Email/password sign-in and account creation (`/login`) gated by
  `ALLOWED_EMAILS` (non-allow-listed emails are rejected before Supabase sign-in/sign-up,
  and any `/auth/callback` flow is re-checked as defence in depth). First sign-in prompts
  once for a `display_name`, which creates the user's `profiles` row. Sign-out action included.
- **Slice 4 — Task CRUD:** Add (`AddTaskForm`), inline edit, soft-delete (`is_active=false`),
  and reorder (up/down, swapping `sort_order`) via server actions in `src/app/tasks/actions.ts`.
  Order persists across reload. Empty-state message when there are no chores.
- **Slice 5 — Check-offs + attribution + notes:** Checkbox state = existence of a
  `completions` row for `(task_id, occurrence_date)`. Checking inserts a row attributed
  to the acting user; unchecking deletes only that date's row (never destructive).
  Checked rows show the checker's `display_name` + time and an inline per-completion
  note. Per-task notes edited via the task edit form. Actions in `src/app/completions/actions.ts`.
- **Slice 6 — Realtime:** `TaskBoard` subscribes to Postgres changes on `tasks` and
  `completions` via the browser Supabase client and calls `router.refresh()` on any change,
  so the other person's check/uncheck and any task edit appears within ~1s without a manual
  refresh. The server re-query (with checker-name join) stays the single source of truth.
- **Slice 7 — Polish:** Week header ("Week of Mon Jun 30") + completion count (e.g. `3/7 done`),
  all-done banner, empty states, and this README.
- **Design refresh — Warm home ritual:** Full UI redesign inspired by the PlanItAhead
  aesthetic: cream paper background, deep green anchors, amber accents, Fraunces/Outfit
  typography, lucide icon controls, refreshed login/name screens, a weekly progress
  dashboard, and warmer task/check-off states. No new env vars.
- **Daily weekly planner:** SQL migration `supabase/migrations/0002_daily_schedule.sql`
  adds recurring weekday chores, date-specific one-off chores, and date-based
  completions. The dashboard now has Week and Calendar views; existing active chores
  become daily recurring chores by default, while old weekly completion rows remain
  preserved as history.

## Deploy (Railway)

1. Create a Railway project from this repo. Railway auto-detects the Next.js app
   (`npm run build` then `npm start`).
2. Set the environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALLOWED_EMAILS`) in the Railway service settings.
3. In Supabase → Authentication, enable email/password auth. Turn off "Confirm email"
   if you want password account creation to sign in immediately without any email step.
   Set the Site URL to your Railway domain and add `<railway-domain>/auth/callback`
   to the redirect allow-list for any confirmation/recovery flows you keep enabled.
4. Run the migrations in `supabase/migrations` against the Supabase project in order.

## How "reset" works (non-destructive)

A chore occurrence is "checked" when a `completions` row exists for
`(task_id, occurrence_date)`. `week_start` is still stored from `getWeekStart()` so
the app can group dates into Monday-start weeks. Unchecking deletes only that one date's
row. When a new day or week arrives, no row exists yet for the new occurrence date, so
scheduled chores show unchecked automatically while previous completions remain in history.
Nothing is ever bulk-reset.
