-- Daily scheduling: recurring weekday chores, one-off chores, and date-based
-- completions. Existing weekly completions are preserved as history.

alter table public.tasks
  add column if not exists schedule_type text not null default 'recurring',
  add column if not exists weekdays integer[] not null default array[0, 1, 2, 3, 4, 5, 6],
  add column if not exists one_off_date date;

update public.tasks
set schedule_type = 'recurring',
    weekdays = array[0, 1, 2, 3, 4, 5, 6],
    one_off_date = null
where schedule_type is null
   or array_length(weekdays, 1) is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_schedule_type_check'
  ) then
    alter table public.tasks
      add constraint tasks_schedule_type_check
      check (schedule_type in ('recurring', 'one_off'));
  end if;
end $$;

create index if not exists tasks_schedule_idx
  on public.tasks (schedule_type, one_off_date)
  where is_active = true;

alter table public.completions
  add column if not exists occurrence_date date;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'completions_task_id_week_start_key'
  ) then
    alter table public.completions
      drop constraint completions_task_id_week_start_key;
  end if;
end $$;

create unique index if not exists completions_task_occurrence_date_key
  on public.completions (task_id, occurrence_date)
  where occurrence_date is not null;

create index if not exists completions_occurrence_date_idx
  on public.completions (occurrence_date)
  where occurrence_date is not null;
