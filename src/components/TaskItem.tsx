"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Repeat,
  Save,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteTask,
  moveTask,
  updateTask,
  type TaskActionState,
} from "@/app/tasks/actions";
import {
  checkTask,
  setCompletionNote,
  uncheckTask,
} from "@/app/completions/actions";
import { formatCheckTime } from "@/lib/format";
import { taskWeekdays, WEEKDAYS } from "@/lib/schedule";
import type { CompletionWithChecker, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: TaskActionState = {};

const fieldClasses =
  "rounded-xl border border-border bg-white/80 px-4 py-3 text-ink placeholder:text-muted focus:border-green focus:outline-none focus:ring-2 focus:ring-green-soft";

export default function TaskItem({
  task,
  occurrenceDate,
  completion,
  isFirst,
  isLast,
}: {
  task: Task;
  occurrenceDate: string;
  completion?: CompletionWithChecker;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [scheduleType, setScheduleType] = useState<"recurring" | "one_off">(
    task.schedule_type,
  );
  const [editState, editAction] = useFormState(updateTask, initialState);
  const selectedWeekdays = taskWeekdays(task);

  useEffect(() => {
    if (editState.ok) {
      setEditing(false);
    }
  }, [editState.ok]);

  useEffect(() => {
    setScheduleType(task.schedule_type);
  }, [task.schedule_type]);

  const checked = Boolean(completion);

  if (editing) {
    return (
      <li className="rounded-2xl border border-border bg-white/75 p-4 shadow-soft backdrop-blur-sm">
        <form action={editAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="schedule_type" value={scheduleType} />

          <label htmlFor={`task-title-${task.id}`} className="sr-only">
            Chore title
          </label>
          <input
            id={`task-title-${task.id}`}
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={task.title}
            className={fieldClasses}
          />

          <label htmlFor={`task-notes-${task.id}`} className="sr-only">
            Task note
          </label>
          <input
            id={`task-notes-${task.id}`}
            name="notes"
            type="text"
            maxLength={500}
            placeholder="Optional task note"
            defaultValue={task.notes ?? ""}
            className={cn(fieldClasses, "py-2.5 text-sm")}
          />

          <div className="grid grid-cols-2 gap-2 rounded-full border border-border bg-cream/70 p-1">
            <button
              type="button"
              onClick={() => setScheduleType("recurring")}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
                scheduleType === "recurring"
                  ? "bg-green text-white shadow-sm"
                  : "text-ink-soft hover:bg-white/70 hover:text-green",
              )}
            >
              <Repeat className="h-4 w-4" aria-hidden="true" />
              Repeat
            </button>
            <button
              type="button"
              onClick={() => setScheduleType("one_off")}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
                scheduleType === "one_off"
                  ? "bg-green text-white shadow-sm"
                  : "text-ink-soft hover:bg-white/70 hover:text-green",
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              One day
            </button>
          </div>

          {scheduleType === "recurring" ? (
            <fieldset>
              <legend className="text-sm font-semibold text-ink">
                Repeat on
              </legend>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {WEEKDAYS.map((weekday) => (
                  <label
                    key={weekday.index}
                    className="flex cursor-pointer items-center justify-center"
                  >
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={weekday.index}
                      defaultChecked={selectedWeekdays.includes(weekday.index)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-9 w-full items-center justify-center rounded-full border border-border bg-white/70 px-2 text-xs font-semibold text-ink-soft transition peer-checked:border-green peer-checked:bg-green peer-checked:text-white">
                      {weekday.short}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div>
              <label
                htmlFor={`one-off-date-${task.id}`}
                className="text-sm font-semibold text-ink"
              >
                Date
              </label>
              <input
                id={`one-off-date-${task.id}`}
                name="one_off_date"
                type="date"
                defaultValue={task.one_off_date ?? occurrenceDate}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white/70 px-4 py-2.5 text-sm text-ink focus:border-green focus:outline-none focus:ring-2 focus:ring-green-soft"
              />
            </div>
          )}

          {editState.error ? (
            <p className="text-sm font-medium text-rose" role="alert">
              {editState.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#284f32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-green hover:bg-green-soft hover:text-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "rounded-2xl border bg-white/75 p-3 shadow-soft backdrop-blur-sm transition sm:p-4",
        checked ? "border-green-soft bg-green-mist" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <CheckButton
          taskId={task.id}
          occurrenceDate={occurrenceDate}
          checked={checked}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-deep sm:text-[11px]">
              {task.schedule_type === "one_off" ? (
                <CalendarDays className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Repeat className="h-3 w-3" aria-hidden="true" />
              )}
              {task.schedule_type === "one_off" ? "One-off" : "Repeats"}
            </span>
          </div>

          <p
            className={cn(
              "break-words font-heading text-base font-semibold leading-snug text-ink sm:text-lg",
              checked && "text-ink-soft line-through decoration-green",
            )}
          >
            {task.title}
          </p>

          {task.notes ? (
            <p className="mt-1 flex gap-1.5 text-sm leading-6 text-ink-soft">
              <StickyNote
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-deep"
                aria-hidden="true"
              />
              <span>{task.notes}</span>
            </p>
          ) : null}

          {completion ? (
            <div className="mt-3 rounded-xl border border-green-soft bg-white/65 p-3">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium text-ink-soft">
                <Clock3 className="h-3.5 w-3.5 text-green" aria-hidden="true" />
                <span>Checked by</span>
                <span className="font-semibold text-green">
                  {completion.checker_name ?? "someone"}
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatCheckTime(completion.completed_at)}</span>
              </p>
              <CompletionNote
                key={`${completion.id}:${completion.note ?? ""}`}
                taskId={task.id}
                occurrenceDate={occurrenceDate}
                note={completion.note}
              />
            </div>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-1.5">
          <MoveButton id={task.id} direction="up" disabled={isFirst} />
          <MoveButton id={task.id} direction="down" disabled={isLast} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit task"
            title="Edit task"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/70 text-ink-soft transition hover:border-green hover:bg-green-soft hover:text-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </button>
          <form action={deleteTask}>
            <input type="hidden" name="id" value={task.id} />
            <button
              type="submit"
              aria-label="Delete task"
              title="Delete task"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/70 text-rose transition hover:border-rose hover:bg-rose-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

function CheckButton({
  taskId,
  occurrenceDate,
  checked,
}: {
  taskId: string;
  occurrenceDate: string;
  checked: boolean;
}) {
  return (
    <form action={checked ? uncheckTask : checkTask}>
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="occurrence_date" value={occurrenceDate} />
      <button
        type="submit"
        role="checkbox"
        aria-checked={checked}
        aria-label={checked ? "Uncheck task" : "Check task"}
        title={checked ? "Uncheck task" : "Check task"}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green",
          checked
            ? "border-green bg-green text-white shadow-lift"
            : "border-border bg-white/80 text-transparent hover:border-green hover:bg-green-soft hover:text-green",
        )}
      >
        <Check className="h-5 w-5" aria-hidden="true" />
      </button>
    </form>
  );
}

function CompletionNote({
  taskId,
  occurrenceDate,
  note,
}: {
  taskId: string;
  occurrenceDate: string;
  note: string | null;
}) {
  return (
    <form action={setCompletionNote} className="mt-2 flex items-center gap-2">
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="occurrence_date" value={occurrenceDate} />
      <label
        htmlFor={`completion-note-${taskId}-${occurrenceDate}`}
        className="sr-only"
      >
        Completion note
      </label>
      <input
        id={`completion-note-${taskId}-${occurrenceDate}`}
        name="note"
        type="text"
        maxLength={500}
        defaultValue={note ?? ""}
        placeholder="Add a note..."
        className="min-w-0 flex-1 rounded-full border border-border bg-white/80 px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-green focus:outline-none focus:ring-2 focus:ring-green-soft"
      />
      <button
        type="submit"
        aria-label="Save completion note"
        title="Save completion note"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green text-white transition hover:bg-[#284f32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
      >
        <Save className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function MoveButton({
  id,
  direction,
  disabled,
}: {
  id: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  const label = direction === "up" ? "Move up" : "Move down";
  const Icon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <form action={moveTask}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        title={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/70 text-ink-soft transition hover:border-green hover:bg-green-soft hover:text-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
