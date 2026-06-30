-- Choreboard initial schema: profiles, tasks, completions + RLS.
--
-- Access model: a fixed two-person household. The email allow-list is enforced
-- at the application/auth layer (magic links are only sent to ALLOWED_EMAILS).
-- RLS here guarantees that:
--   * unauthenticated (anon) requests can read/write nothing, and
--   * any authenticated user can use the shared list,
--   * a user can only create/edit their own profile and can only attribute
--     completions to themselves.

-- ---------------------------------------------------------------------------
-- profiles (mirrors auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text
);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text        not null,
  notes      text,                          -- persistent note attached to the task
  sort_order integer     not null,          -- for manual reordering
  is_active  boolean     not null default true,  -- soft-delete; keeps history valid
  created_at timestamptz not null default now()
);

create index if not exists tasks_active_sort_idx
  on public.tasks (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- completions (one row per task per week == "checked")
-- ---------------------------------------------------------------------------
create table if not exists public.completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid        not null references public.tasks (id) on delete cascade,
  week_start   date        not null,        -- from getWeekStart()
  completed_by uuid        not null references public.profiles (id),
  completed_at timestamptz not null default now(),
  note         text,                        -- optional note for this specific check-off
  unique (task_id, week_start)              -- one completion per task per week
);

create index if not exists completions_week_idx
  on public.completions (week_start);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.tasks       enable row level security;
alter table public.completions enable row level security;

-- profiles ------------------------------------------------------------------
-- Everyone authenticated can read profiles (needed to show "who checked it").
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- A user may only create their own profile row.
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- A user may only update their own profile row.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- tasks ---------------------------------------------------------------------
-- Shared list: any authenticated household member has full access.
drop policy if exists "tasks_select_authenticated" on public.tasks;
create policy "tasks_select_authenticated"
  on public.tasks for select
  to authenticated
  using (true);

drop policy if exists "tasks_insert_authenticated" on public.tasks;
create policy "tasks_insert_authenticated"
  on public.tasks for insert
  to authenticated
  with check (true);

drop policy if exists "tasks_update_authenticated" on public.tasks;
create policy "tasks_update_authenticated"
  on public.tasks for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "tasks_delete_authenticated" on public.tasks;
create policy "tasks_delete_authenticated"
  on public.tasks for delete
  to authenticated
  using (true);

-- completions ---------------------------------------------------------------
-- Shared: any authenticated member can read/check/uncheck. Inserts must be
-- attributed to the acting user; notes/uncheck are open to either member.
drop policy if exists "completions_select_authenticated" on public.completions;
create policy "completions_select_authenticated"
  on public.completions for select
  to authenticated
  using (true);

drop policy if exists "completions_insert_self" on public.completions;
create policy "completions_insert_self"
  on public.completions for insert
  to authenticated
  with check (auth.uid() = completed_by);

drop policy if exists "completions_update_authenticated" on public.completions;
create policy "completions_update_authenticated"
  on public.completions for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "completions_delete_authenticated" on public.completions;
create policy "completions_delete_authenticated"
  on public.completions for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Realtime: expose tasks + completions on the realtime publication so the app
-- can subscribe to cross-session changes.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'completions'
  ) then
    alter publication supabase_realtime add table public.completions;
  end if;
end $$;
