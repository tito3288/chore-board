# spec.md — Choreboard

> **Bryan: review this file before launch.** Assumptions and the definition of done are
> the two sections to check hardest.

## Assumptions made (flag any that are wrong)
1. **Two users, one shared list.** No multi-household concept. Every authenticated user
   sees and edits the same task set. Access is gated by an allow-list of two emails.
2. **Auth = Supabase email magic link.** No passwords. The two emails are set via an
   `ALLOWED_EMAILS` env var; magic-link requests from any other email are rejected.
3. **Week boundary = Monday 00:00 America/New_York.** Hardcoded timezone (your zip 46614).
4. **"Reset" is non-destructive.** Completions are stored per `week_start`. A new week
   shows everything unchecked automatically; old weeks stay in history.
5. **No push notifications** (scoped out this build).
6. **Scope = Core + attribution + notes.** Specifically: shared list, check/uncheck,
   add/edit/delete/reorder tasks, who-checked-it attribution, per-task notes, and a quick
   per-completion note. No streaks, no points, no day-of-week tags, no calendar.

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

**completions**
- `id` uuid PK
- `task_id` uuid FK → tasks
- `week_start` date not null    — from getWeekStart()
- `completed_by` uuid FK → profiles
- `completed_at` timestamptz
- `note` text null              — optional note for this specific check-off
- UNIQUE(`task_id`, `week_start`) — one completion per task per week

RLS: all three tables — authenticated users in the allow-list can SELECT/INSERT/UPDATE/DELETE.

## Behavior
1. Sign in via magic link (allow-listed emails only). First sign-in creates a `profiles`
   row; prompt once for `display_name`.
2. Home screen lists active tasks in `sort_order`, each with a checkbox.
3. Checkbox state = "does a completion row exist for this task + current `week_start`?"
4. Checking inserts a completion (`completed_by` = me, `completed_at` = now). Unchecking
   deletes that week's completion row for the task.
5. Checked rows show **who** checked it + when. Optional inline note field on a checked row.
6. Realtime: subscribe to `completions` and `tasks`. The other person's check/uncheck and
   any task add/edit/delete appears within ~1s without refresh.
7. Add task (title + optional notes). Edit title/notes. Delete = set `is_active=false`.
   Reorder via up/down or drag, persisted to `sort_order`.
8. A small header shows current week ("Week of Mon Jun 30") and completion count (e.g. 3/7).

## getWeekStart helper (single source of truth)
Returns the ISO date (YYYY-MM-DD) of the Monday of the week containing `date`, computed in
America/New_York. Sunday counts as the prior Monday's week. Must have unit tests covering:
a mid-week date, a Sunday, a Monday (returns itself), and a New York DST changeover week.

## Definition of done
- [ ] `npm run build`, `npm test`, `npm run lint` all green.
- [ ] `getWeekStart` unit tests pass (the 4 cases above).
- [ ] Magic-link sign-in works; non-allow-listed email is rejected.
- [ ] Can add, edit, delete (soft), and reorder tasks; order persists across reload.
- [ ] Checking a task this week, then reloading, keeps it checked. Simulating a date in the
      following week shows it unchecked while last week's completion still exists in the DB.
- [ ] Checked rows display the checker's `display_name` and time.
- [ ] Per-task notes and per-completion notes save and reload correctly.
- [ ] Two browser sessions (two accounts): a check in one appears in the other within ~2s
      with no manual refresh (Realtime verified).
- [ ] RLS policies exist on all three tables; an unauthenticated request returns no rows.
- [ ] PWA installs to home screen (valid manifest + icons); loads when launched standalone.
- [ ] README documents setup, env vars (`ALLOWED_EMAILS`, Supabase URL/anon key), and deploy.

## Out of scope (do not build)
Push/web notifications, streaks, points, day-of-week scheduling, recurring-task engine,
calendar sync, multi-household, native iOS.
