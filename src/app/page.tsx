import { redirect } from "next/navigation";
import { CalendarDays, ClipboardCheck, LogOut, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TaskBoard from "@/components/TaskBoard";
import type { CompletionWithChecker, Completion, Profile, Task } from "@/lib/types";
import { getWeekStart } from "@/lib/week";
import { formatWeekLabel } from "@/lib/format";
import {
  expandTasksForWeek,
  monthDatesContaining,
  weekDatesFromStart,
} from "@/lib/schedule";
import { signOut } from "./actions";
import DisplayNamePrompt from "./DisplayNamePrompt";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  // First sign-in (or no name yet) — prompt once for a display name.
  if (!profile || !profile.display_name) {
    return <DisplayNamePrompt />;
  }

  const weekStart = getWeekStart(new Date());
  const weekDates = weekDatesFromStart(weekStart);
  const calendarBaseDate = weekDates[3]?.iso ?? weekStart;
  const calendarDates = monthDatesContaining(calendarBaseDate);
  const calendarStart = calendarDates[0];
  const calendarEnd = calendarDates[calendarDates.length - 1];

  const [{ data: tasks }, { data: completionsRaw }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("completions")
        .select("*")
        .not("occurrence_date", "is", null)
        .gte("occurrence_date", calendarStart)
        .lte("occurrence_date", calendarEnd),
      supabase.from("profiles").select("id, display_name"),
    ]);

  const nameById = new Map<string, string | null>(
    ((profiles as Pick<Profile, "id" | "display_name">[]) ?? []).map((p) => [
      p.id,
      p.display_name,
    ]),
  );

  const activeTasks = (tasks as Task[]) ?? [];

  const completions: CompletionWithChecker[] = (
    (completionsRaw as Completion[]) ?? []
  ).map((c) => ({
    ...c,
    checker_name: nameById.get(c.completed_by) ?? null,
  }));

  const weekOccurrences = expandTasksForWeek(activeTasks, weekDates, completions);
  const doneCount = weekOccurrences.filter((occurrence) =>
    Boolean(occurrence.completion),
  ).length;
  const totalCount = weekOccurrences.length;
  const progressPercent =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <main className="min-h-screen px-3 py-3 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5">
        <header className="rounded-2xl border border-border bg-white/70 p-4 shadow-soft backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-amber-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-deep">
                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Shared weekly rhythm
              </div>
              <h1 className="mt-3 font-heading text-4xl font-semibold leading-none text-green sm:mt-4 sm:text-6xl">
                Choreboard
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft sm:mt-3 sm:text-base">
                A calm little home base for the chores that keep the week
                moving.
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center justify-between gap-3 rounded-full border border-border bg-white/65 py-1 pl-3 pr-1 shadow-sm sm:w-auto sm:justify-start">
              <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                <UserRound className="h-4 w-4 text-green" aria-hidden="true" />
                <span className="truncate">{profile.display_name}</span>
              </span>
              <span className="h-6 w-px bg-border" aria-hidden="true" />
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-green-soft hover:text-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>

          <section className="mt-4 rounded-2xl border border-border bg-cream/70 p-3 sm:mt-6 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-deep">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {formatWeekLabel(weekStart)}
                </p>
                <p className="mt-2 font-heading text-2xl font-semibold leading-tight text-ink">
                  {totalCount > 0 && doneCount === totalCount
                    ? "The week is wrapped."
                    : "This week at home"}
                </p>
              </div>
              <div className="flex items-end justify-between gap-3 sm:block sm:text-right">
                <p className="font-heading text-3xl font-semibold text-green">
                  {doneCount}/{totalCount}
                </p>
                <p className="text-sm font-medium text-ink-soft">done</p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-border">
              <div
                className="h-full rounded-full bg-green transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>
        </header>

        <TaskBoard
          tasks={activeTasks}
          completions={completions}
          weekStart={weekStart}
          calendarBaseDate={calendarBaseDate}
        />
      </div>
    </main>
  );
}
