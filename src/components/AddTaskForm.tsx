"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CalendarDays, NotebookPen, Plus, Repeat } from "lucide-react";
import { addTask, type TaskActionState } from "@/app/tasks/actions";
import { WEEKDAYS } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const initialState: TaskActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:bg-[#284f32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:opacity-60 sm:w-auto"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {pending ? "Adding..." : "Add chore"}
    </button>
  );
}

export default function AddTaskForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction] = useFormState(addTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [scheduleType, setScheduleType] = useState<"recurring" | "one_off">(
    "recurring",
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setScheduleType("recurring");
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-border bg-white/70 p-3 shadow-soft backdrop-blur-sm sm:p-5"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.55fr)_minmax(0,1.45fr)] xl:items-start">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-soft text-amber-deep">
            <NotebookPen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink">
              Add to the board
            </h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-ink-soft">
              Choose whether this chore repeats through the week or belongs to
              one specific date.
            </p>
          </div>
        </div>

        <div>
          <input type="hidden" name="schedule_type" value={scheduleType} />

          <div className="mb-3 grid max-w-lg grid-cols-2 gap-1.5 rounded-2xl border border-border bg-cream/70 p-1 sm:mb-4 sm:gap-2 sm:rounded-full">
            <button
              type="button"
              onClick={() => setScheduleType("recurring")}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green sm:min-h-10 sm:rounded-full",
                scheduleType === "recurring"
                  ? "bg-green text-white shadow-sm"
                  : "text-ink-soft hover:bg-white/70 hover:text-green",
              )}
            >
              <Repeat className="h-4 w-4" aria-hidden="true" />
              Repeat weekly
            </button>
            <button
              type="button"
              onClick={() => setScheduleType("one_off")}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green sm:min-h-10 sm:rounded-full",
                scheduleType === "one_off"
                  ? "bg-green text-white shadow-sm"
                  : "text-ink-soft hover:bg-white/70 hover:text-green",
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              One date
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.75fr)]">
            <label htmlFor="new-task-title" className="sr-only">
              Chore title
            </label>
            <input
              id="new-task-title"
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="Add a chore..."
              className="min-h-12 rounded-xl border border-border bg-white/80 px-4 py-3 text-base text-ink placeholder:text-muted focus:border-green focus:outline-none focus:ring-2 focus:ring-green-soft"
            />
            <label htmlFor="new-task-notes" className="sr-only">
              Optional note
            </label>
            <input
              id="new-task-notes"
              name="notes"
              type="text"
              maxLength={500}
              placeholder="Optional note"
              className="min-h-12 rounded-xl border border-border bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-green focus:outline-none focus:ring-2 focus:ring-green-soft"
            />
          </div>

          {scheduleType === "recurring" ? (
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-ink">
                Repeat on
              </legend>
              <div className="mt-2 grid grid-cols-4 gap-2 min-[430px]:grid-cols-7">
                {WEEKDAYS.map((weekday) => (
                  <label key={weekday.index} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={weekday.index}
                      defaultChecked
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border bg-white/70 px-2 text-sm font-semibold text-ink-soft transition peer-checked:border-green peer-checked:bg-green peer-checked:text-white">
                      {weekday.short}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="mt-4 max-w-sm">
              <label
                htmlFor="new-task-one-off-date"
                className="text-sm font-semibold text-ink"
              >
                Date
              </label>
              <input
                id="new-task-one-off-date"
                name="one_off_date"
                type="date"
                defaultValue={defaultDate}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white/70 px-4 py-2.5 text-sm text-ink focus:border-green focus:outline-none focus:ring-2 focus:ring-green-soft"
              />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {state.error ? (
              <p className="text-sm font-medium text-rose" role="alert">
                {state.error}
              </p>
            ) : (
              <p className="text-sm text-muted">
                These chores will appear on the days you choose.
              </p>
            )}
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}
