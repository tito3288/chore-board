# VERIFICATION.md — Choreboard

Independent verification against `spec.md` → "Definition of done" and "Assumptions".
Verifier does not write or fix feature code. Each box is PASS only with evidence
(a green command or a specific file:line). Items requiring a live Supabase instance or
two real browsers are verified by code inspection and labeled as such.

## Commands (run from project root)

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | PASS | `✔ No ESLint warnings or errors` |
| `npm run build` | PASS | `✓ Compiled successfully` / `✓ Generating static pages (6/6)`; routes `/`, `/login`, `/auth/callback` built |
| `npm test` | PASS | `Test Files 1 passed (1)` / `Tests 8 passed (8)` (`src/lib/week.test.ts`) |

All three commands green.

## Definition-of-done checklist

### 1. `npm run build`, `npm test`, `npm run lint` all green — PASS
See command table above. All three exit clean.

### 2. `getWeekStart` unit tests pass (4 required cases) — PASS
`src/lib/week.test.ts` covers all four required cases plus extras:
- Mid-week: line 5-8 (Wed 2024-01-03 → `2024-01-01`).
- Sunday → prior Monday: line 10-13 (Sun 2024-01-07 → `2024-01-01`).
- Monday returns itself: line 15-18 (Mon 2024-01-01 → `2024-01-01`).
- NY DST changeover week: line 20-28 (spring-forward week of 2024-03-10, Monday `2024-03-04`),
  plus fall-back week (line 30-34) and two NY-vs-UTC day-boundary cases (line 36-46).
Implementation `src/lib/week.ts:31-72` resolves the NY calendar date via
`Intl.DateTimeFormat` (timeZone `America/New_York`) then does pure UTC calendar arithmetic —
DST-safe. 8/8 tests pass.

### 3. Migration creates all 3 tables with RLS policies — PASS
`supabase/migrations/0001_init.sql`:
- `profiles` table line 14-17; `tasks` line 22-29; `completions` line 37-45 with
  `unique (task_id, week_start)` line 44.
- RLS enabled on all three: line 53-55 (`enable row level security`).
- Policies present: profiles select/insert/update line 59-78; tasks select/insert/update/delete
  line 82-105; completions select/insert(self)/update/delete line 110-133.
- All policies are scoped `to authenticated` only; there is **no** `anon` policy. With RLS
  enabled and no anon grant, an unauthenticated request returns zero rows (see box 9).
- Realtime publication adds `tasks` and `completions` line 139-153.

### 4. Magic-link sign-in; non-allow-listed email rejected — PASS (logic by code inspection; live send needs Supabase)
- Allow-list helper `src/lib/env.ts:39-42` (`isEmailAllowed`, lowercased/trimmed compare).
- Send path rejects before sending: `src/app/login/actions.ts:29-35` returns an error and
  never calls `signInWithOtp` for a non-listed email.
- Defence-in-depth at callback: `src/app/auth/callback/route.ts:29-32` re-checks the email
  after code exchange and signs the user out + redirects `?error=not_allowed` if not allowed.
NOTE: actual email delivery / OTP exchange requires a live Supabase project and cannot be
runtime-verified here; the rejection logic is fully verifiable in code and is correct.

### 5. Add / edit / soft-delete / reorder tasks; order persists — PASS (logic by code inspection)
`src/app/tasks/actions.ts`:
- Add: line 17-54 (inserts with `sort_order` = max+1).
- Edit: line 57-89 (updates title + notes).
- Soft-delete: line 92-101 (`update({ is_active: false })`, never deletes the row).
- Reorder: line 104-140 (swaps `sort_order` with the active neighbour, persisted to DB).
- Home query orders by `sort_order` ascending: `src/app/page.tsx:37-41`, so order persists
  across reload. UI wiring in `src/components/TaskItem.tsx:124-145` (move/edit/delete).
NOTE: round-trip persistence needs a live DB to exercise; the write paths and the ordered
read query are verified in code.

### 6. Check this week stays checked on reload; next week shows unchecked while history persists — PASS (derivation by code inspection)
- Checked state is derived from row existence per week, NOT a boolean on the task:
  home query `src/app/page.tsx:42` selects completions `.eq("week_start", weekStart)` where
  `weekStart = getWeekStart(new Date())` (line 33); `TaskBoard` maps completion-by-task and
  `checked = Boolean(completion)` (`src/components/TaskItem.tsx:41`).
- Check inserts a `(task_id, week_start, completed_by)` row: `src/app/completions/actions.ts:29-33`.
- Uncheck deletes ONLY this week's row: `src/app/completions/actions.ts:56-60`
  (`.eq("task_id", …).eq("week_start", weekStart)`), so past weeks are untouched.
- A new week has no row for the new `week_start` → everything shows unchecked automatically;
  prior weeks' rows remain. This matches the non-destructive "reset" rule.
NOTE: simulating "next week" requires a live DB; the week-keyed derivation is verified in code
and is structurally correct (no task-level boolean exists in the schema, `database.types.ts:32-58`).

### 7. Checked rows display checker `display_name` + time — PASS
- `src/app/page.tsx:46-60` joins each completion's `completed_by` to a `display_name`
  (`checker_name`).
- `src/components/TaskItem.tsx:106-114` renders "Checked by {checker_name} · {formatCheckTime}".
- `src/lib/format.ts:6-13` formats time in `America/New_York` (e.g. "Mon 7:45 PM").

### 8. Per-task notes and per-completion notes save and reload — PASS (logic by code inspection)
- Per-task note persists via `updateTask` (`src/app/tasks/actions.ts:78-81`, `notes` column);
  edited in the task edit form `src/components/TaskItem.tsx:56-63`.
- Per-completion note persists via `setCompletionNote`
  (`src/app/completions/actions.ts:66-85`, updates `note` on the `(task_id, week_start)` row);
  UI input `src/components/TaskItem.tsx:178-204`.
- Both read back from the same rows on reload (`page.tsx` selects `*`).
NOTE: round-trip needs a live DB; both write paths target the correct columns.

### 9. RLS on all three tables; unauthenticated request returns no rows — PASS (by code inspection of SQL)
- RLS enabled: `supabase/migrations/0001_init.sql:53-55`.
- Every policy is `to authenticated` (line 61, 69, 76, 85, 91, 97, 104, 113, 119, 125, 131);
  there is no policy granting `anon`. Postgres RLS denies by default, so an anonymous
  (unauthenticated) client matches no policy and receives zero rows.
NOTE: cannot issue a live anon query here; the policy set provably excludes anon.

### 10. PWA installs (valid manifest + icons); loads standalone — PASS (by code inspection)
- `public/manifest.json:1-25` valid: `name`, `short_name`, `start_url` `/`, `display`
  `standalone`, `theme_color`, and two `icons` (192, 512).
- Manifest linked from the document head: `src/app/layout.tsx:7` (`metadata.manifest`),
  plus apple-web-app + icon metadata line 8-16.
- Icons are real PNGs: `file public/icons/icon-192.png` → "PNG image data, 192 x 192";
  `icon-512.png` → "512 x 512".
- Middleware excludes `manifest.json` and `icons/` from auth so they load when launched
  standalone: `src/middleware.ts:16`.
NOTE: actual home-screen install is a browser action and cannot be runtime-verified here;
manifest validity, linkage, and icon presence are confirmed.

### 11. README documents setup, env vars, deploy — PASS
`README.md`:
- Getting started line 14-20; env vars table line 26-30 documents `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALLOWED_EMAILS`.
- Database setup line 69-80; Railway deploy steps line 101-109; non-destructive-reset
  explanation line 111-117.

### Realtime subscriptions for BOTH tasks and completions — PASS (by code inspection)
`src/components/TaskBoard.tsx:21-40` opens one channel with two `postgres_changes`
subscriptions — `table: "tasks"` (line 26-29) and `table: "completions"` (line 30-34) —
each calling `router.refresh()`. Both tables are added to the `supabase_realtime`
publication in the migration (line 139-153).
NOTE: cross-session ~2s propagation requires two live browser sessions + Supabase and was
not runtime-verified; the subscriptions and publication are present and correct in code.

## Hard-rules / assumptions audit
- TypeScript strict on: `tsconfig.json:7` (`"strict": true`). Build's type-check passed.
- No `any`: `grep -rn` for `any` in `src/` → none found; `.eslintrc.json` sets
  `@typescript-eslint/no-explicit-any: "error"` and lint is clean.
- Single week helper used everywhere: `getWeekStart` imported in `page.tsx` and
  `completions/actions.ts`; week boundary is Monday 00:00 `America/New_York` (`week.ts:12`).
- Non-destructive reset honored (box 6): no task-level checked boolean exists.
- Out-of-scope items (push, streaks, points, day-of-week, calendar, multi-household) — none
  found in code. Assumptions in spec.md match what was built.

## Caveats (could not be runtime-verified without external resources)
The following are PASS by code inspection only, because they need a live Supabase project
and/or two browsers: box 4 (live magic-link), box 5/6/8 (DB round-trips), box 9 (live anon
query), box 10 (actual install), and Realtime cross-session timing. Each has a concrete
file:line proving the implementation is present and correct; none was marked PASS on faith.

RESULT: PASS
