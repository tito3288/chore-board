"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, LayoutList, Sparkles } from "lucide-react";
import AddTaskForm from "@/components/AddTaskForm";
import TaskItem from "@/components/TaskItem";
import { createClient } from "@/lib/supabase/client";
import type { CompletionWithChecker, Task } from "@/lib/types";
import {
  completionByOccurrence,
  completionKey,
  expandTasksForWeek,
  monthDatesContaining,
  monthLabel,
  taskOccursOnDate,
  weekDatesFromStart,
  weekdayIndexForIso,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

type BoardView = "week" | "calendar";

export default function TaskBoard({
  tasks,
  completions,
  weekStart,
  calendarBaseDate,
}: {
  tasks: Task[];
  completions: CompletionWithChecker[];
  weekStart: string;
  calendarBaseDate: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<BoardView>("week");

  // Realtime: when either table changes (from this or the other session),
  // re-fetch the server data so the joined view stays the single source of truth.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("choreboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const weekDates = useMemo(() => weekDatesFromStart(weekStart), [weekStart]);
  const occurrences = useMemo(
    () => expandTasksForWeek(tasks, weekDates, completions),
    [tasks, weekDates, completions],
  );
  const completionMap = useMemo(
    () => completionByOccurrence(completions),
    [completions],
  );
  const taskOrder = useMemo(
    () => new Map(tasks.map((task, index) => [task.id, index])),
    [tasks],
  );
  const calendarDates = useMemo(
    () => monthDatesContaining(calendarBaseDate),
    [calendarBaseDate],
  );

  const allDone =
    occurrences.length > 0 &&
    occurrences.every((occurrence) => Boolean(occurrence.completion));

  return (
    <div className="flex flex-col gap-4">
      <AddTaskForm defaultDate={weekDates[0]?.iso ?? weekStart} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/70 p-3 shadow-soft backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-deep">
              Board view
            </p>
            <p className="text-sm text-ink-soft">
              Work the week by day, or scan the month at a glance.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-border bg-cream/70 p-1 sm:w-80 sm:gap-2 sm:rounded-full">
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green sm:min-h-10 sm:rounded-full",
                view === "week"
                  ? "bg-green text-white shadow-sm"
                  : "text-ink-soft hover:bg-white/70 hover:text-green",
              )}
            >
              <LayoutList className="h-4 w-4" aria-hidden="true" />
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green sm:min-h-10 sm:rounded-full",
                view === "calendar"
                  ? "bg-green text-white shadow-sm"
                  : "text-ink-soft hover:bg-white/70 hover:text-green",
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Calendar
            </button>
          </div>
        </div>

        {allDone ? (
          <div className="rounded-2xl border border-green-soft bg-green-soft p-4 text-green shadow-soft">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/75">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading text-xl font-semibold">
                  All wrapped for the week.
                </p>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  The board is clear and the house can exhale.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/60 p-5 text-center shadow-soft sm:p-6">
            <ClipboardList
              className="mx-auto h-8 w-8 text-amber-deep"
              aria-hidden="true"
            />
            <p className="mt-3 font-heading text-2xl font-semibold text-ink">
              A fresh board.
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">
              Add the first chore and this week&apos;s rhythm will start to
              take shape.
            </p>
          </div>
        ) : null}

        {view === "calendar" ? (
          <CalendarView
            dates={calendarDates}
            tasks={tasks}
            completionMap={completionMap}
            weekStart={weekStart}
            calendarBaseDate={calendarBaseDate}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {weekDates.map((day) => {
              const dayOccurrences = occurrences.filter(
                (occurrence) => occurrence.occurrenceDate === day.iso,
              );
              const doneCount = dayOccurrences.filter((occurrence) =>
                Boolean(occurrence.completion),
              ).length;

              return (
                <section
                  key={day.iso}
                  className="rounded-2xl border border-border bg-white/70 p-3 shadow-soft backdrop-blur-sm sm:p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-deep">
                        {day.shortLabel}
                      </p>
                      <h3 className="font-heading text-2xl font-semibold text-ink">
                        {day.longLabel}
                      </h3>
                      <p className="text-sm font-medium text-ink-soft">
                        {day.dateLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-soft px-2.5 py-1 text-xs font-semibold text-green">
                      {doneCount}/{dayOccurrences.length}
                    </span>
                  </div>

                  {dayOccurrences.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-white/50 p-4 text-sm text-ink-soft">
                      <p className="font-medium">Nothing planned.</p>
                      <p className="mt-1 text-xs leading-5">
                        Add a repeating chore or a one-date extra above.
                      </p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {dayOccurrences.map((occurrence) => {
                        const index = taskOrder.get(occurrence.task.id) ?? 0;
                        return (
                          <TaskItem
                            key={occurrence.id}
                            task={occurrence.task}
                            occurrenceDate={occurrence.occurrenceDate}
                            completion={occurrence.completion}
                            isFirst={index === 0}
                            isLast={index === tasks.length - 1}
                          />
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CalendarView({
  dates,
  tasks,
  completionMap,
  weekStart,
  calendarBaseDate,
}: {
  dates: string[];
  tasks: Task[];
  completionMap: Map<string, CompletionWithChecker>;
  weekStart: string;
  calendarBaseDate: string;
}) {
  const activeMonth = calendarBaseDate.slice(0, 7);

  return (
    <section className="rounded-2xl border border-border bg-white/70 p-3 shadow-soft backdrop-blur-sm sm:p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-deep">
            Calendar
          </p>
          <h2 className="font-heading text-3xl font-semibold text-ink">
            {monthLabel(calendarBaseDate)}
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-6 text-ink-soft sm:text-right">
          Dots show scheduled chores. Green means all scheduled chores are done.
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {dates.map((date) => {
          const weekdayIndex = weekdayIndexForIso(date);
          const scheduled = tasks.filter((task) =>
            taskOccursOnDate(task, date, weekdayIndex),
          );
          const done = scheduled.filter((task) =>
            completionMap.has(completionKey(task.id, date)),
          );
          const inMonth = date.slice(0, 7) === activeMonth;
          const isCurrentWeek =
            date >= weekStart && date <= addDays(weekStart, 6);
          const allDone =
            scheduled.length > 0 && done.length === scheduled.length;

          return (
            <div
              key={date}
              className={cn(
                "min-h-16 rounded-lg border p-1.5 text-left sm:min-h-20 sm:rounded-xl sm:p-2",
                isCurrentWeek
                  ? "border-green bg-green-mist"
                  : "border-border bg-white/60",
                !inMonth && "opacity-45",
              )}
            >
              <p className="text-sm font-semibold text-ink">
                {Number(date.slice(8, 10))}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {scheduled.slice(0, 5).map((task) => (
                  <span
                    key={task.id}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      completionMap.has(completionKey(task.id, date))
                        ? "bg-green"
                        : "bg-amber",
                    )}
                  />
                ))}
              </div>
              {scheduled.length > 0 ? (
                <p
                  className={cn(
                    "mt-2 text-[11px] font-semibold",
                    allDone ? "text-green" : "text-ink-soft",
                  )}
                >
                  {done.length}/{scheduled.length}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
