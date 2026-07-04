# spec.md — Choreboard

> **Bryan: review this file before launch.** Assumptions and the definition of done are
> the two sections to check hardest.

## Assumptions made (flag any that are wrong)
1. **Two users, one shared list.** No multi-household concept. Every authenticated user
   sees and edits the same task set. Access is gated by an allow-list of two emails.
2. **Auth = Supabase email/password.** The two emails are set via an `ALLOWED_EMAILS`
   env var; sign-in/sign-up requests from any other email are rejected.
3. **Week boundary = Monday 00:00 America/New_York.** Hardcoded timezone (your zip 46614).
4. **"Reset" is non-destructive.** New completions are stored per `occurrence_date`
   and `week_start`. A new week/date shows unchecked automatically; old completions
   stay in history.
5. **No push notifications** (scoped out this build).
6. **Scope = Core + daily scheduling + attribution + notes.** Specifically: shared
   Monday-Sunday board, recurring weekday chores, date-specific one-off chores,
   check/uncheck per date, add/edit/delete/reorder tasks, who-checked-it attribution,
   per-task notes, and a quick per-completion note. No streaks, no points, no
   full recurring-rule engine, no native calendar sync.

## Data model
**profiles** (mirrors auth.users)
- `id` uuid PK (= auth uid)
- `display_name` text

**tasks**
- `id` uuid PK
- `title` text not null
- `notes` text null            — persistent note attached to the task itself
- `sort_order` int not null    — for reorder
- `is_active` bool default true — soft-delete (so historical completions stay valid)
- `created_at` timestamptz
- `schedule_type` text         — `recurring` or `one_off`
- `weekdays` int[]             — Monday=0 through Sunday=6 for recurring chores
- `one_off_date` date null     — exact date for one-off chores

**completions**
- `id` uuid PK
- `task_id` uuid FK → tasks
- `week_start` date not null    — from getWeekStart()
- `occurrence_date` date null   — exact date checked; old weekly rows may be null
- `completed_by` uuid FK → profiles
- `completed_at` timestamptz
- `note` text null              — optional note for this specific check-off
- UNIQUE(`task_id`, `occurrence_date`) where `occurrence_date is not null`

RLS: all three tables — authenticated users in the allow-list can SELECT/INSERT/UPDATE/DELETE.

## Behavior
1. Sign in or create an account with email/password (allow-listed emails only). First
   sign-in creates a `profiles` row; prompt once for `display_name`.
2. Home screen shows a Monday-Sunday weekly board. Recurring chores appear on their
   selected weekdays; one-off chores appear only on their exact date.
3. Checkbox state = "does a completion row exist for this task + `occurrence_date`?"
4. Checking inserts a completion (`completed_by` = me, `completed_at` = now,
   `occurrence_date` = that day). Unchecking deletes only that date's completion row.
5. Checked occurrences show **who** checked it + when. Optional inline note field on a
   checked occurrence.
6. Realtime: subscribe to `completions` and `tasks`. The other person's check/uncheck and
   any task add/edit/delete appears within ~1s without refresh.
7. Add task (title + optional notes) as recurring weekday chore or one-off dated chore.
   Edit title/notes/schedule. Delete = set `is_active=false`. Reorder via up/down,
   persisted to `sort_order`.
8. A small header shows current week ("Week of Mon Jun 30") and completion count for
   scheduled occurrences (e.g. 3/12).
9. Calendar view shows a compact month with scheduled chore counts and completion dots.

## getWeekStart helper (single source of truth)
Returns the ISO date (YYYY-MM-DD) of the Monday of the week containing `date`, computed in
America/New_York. Sunday counts as the prior Monday's week. Must have unit tests covering:
a mid-week date, a Sunday, a Monday (returns itself), and a New York DST changeover week.

## Definition of done
- [ ] `npm run build`, `npm test`, `npm run lint` all green.
- [ ] `getWeekStart` unit tests pass (the 4 cases above).
- [ ] Daily scheduling helper tests pass for Monday-Sunday dates, selected weekdays,
      one-off dates, and independent date completions.
- [ ] Email/password sign-in works; non-allow-listed email is rejected.
- [ ] Can add, edit, delete (soft), and reorder recurring and one-off tasks; order persists
      across reload.
- [ ] Checking a task occurrence for one day, then reloading, keeps that date checked while
      another date for the same recurring chore remains independent.
- [ ] Simulating the following week shows fresh unchecked occurrences while previous dates'
      completions still exist in the DB.
- [ ] Checked rows display the checker's `display_name` and time.
- [ ] Per-task notes and per-completion notes save and reload correctly.
- [ ] Two browser sessions (two accounts): a check in one appears in the other within ~2s
      with no manual refresh (Realtime verified).
- [ ] RLS policies exist on all three tables; an unauthenticated request returns no rows.
- [ ] PWA installs to home screen (valid manifest + icons); loads when launched standalone.
- [ ] README documents setup, env vars (`ALLOWED_EMAILS`, Supabase URL/anon key), and deploy.

## Out of scope (do not build)
Push/web notifications, streaks, points, complex recurrence rules, native calendar sync,
multi-household, native iOS.
