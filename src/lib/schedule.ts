import type { CompletionWithChecker, Task } from "@/lib/types";
import { getWeekStart } from "@/lib/week";

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeekDate = {
  iso: string;
  weekdayIndex: WeekdayIndex;
  shortLabel: string;
  longLabel: string;
  dateLabel: string;
};

export type TaskOccurrence = {
  id: string;
  task: Task;
  occurrenceDate: string;
  weekdayIndex: WeekdayIndex;
  completion?: CompletionWithChecker;
};

export const WEEKDAYS: Array<{
  index: WeekdayIndex;
  short: string;
  long: string;
}> = [
  { index: 0, short: "Mon", long: "Monday" },
  { index: 1, short: "Tue", long: "Tuesday" },
  { index: 2, short: "Wed", long: "Wednesday" },
  { index: 3, short: "Thu", long: "Thursday" },
  { index: 4, short: "Fri", long: "Friday" },
  { index: 5, short: "Sat", long: "Saturday" },
  { index: 6, short: "Sun", long: "Sunday" },
];

const MS_PER_DAY = 86_400_000;

function isoDateAtOffset(startIso: string, offset: number): string {
  const start = new Date(`${startIso}T12:00:00Z`);
  const shifted = new Date(start.getTime() + offset * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function addDaysIso(startIso: string, offset: number): string {
  return isoDateAtOffset(startIso, offset);
}

export function weekDatesFromStart(weekStart: string): WeekDate[] {
  return WEEKDAYS.map((weekday) => {
    const iso = isoDateAtOffset(weekStart, weekday.index);
    return {
      iso,
      weekdayIndex: weekday.index,
      shortLabel: weekday.short,
      longLabel: weekday.long,
      dateLabel: formatDateLabel(iso),
    };
  });
}

export function getCurrentWeekDates(date: Date): WeekDate[] {
  return weekDatesFromStart(getWeekStart(date));
}

export function completionKey(taskId: string, occurrenceDate: string): string {
  return `${taskId}:${occurrenceDate}`;
}

export function completionByOccurrence(
  completions: CompletionWithChecker[],
): Map<string, CompletionWithChecker> {
  const map = new Map<string, CompletionWithChecker>();
  for (const completion of completions) {
    if (completion.occurrence_date) {
      map.set(
        completionKey(completion.task_id, completion.occurrence_date),
        completion,
      );
    }
  }
  return map;
}

export function taskWeekdays(task: Task): WeekdayIndex[] {
  if (task.schedule_type === "one_off") {
    return [];
  }

  const raw = task.weekdays.length > 0 ? task.weekdays : [0, 1, 2, 3, 4, 5, 6];
  return raw
    .filter((day): day is WeekdayIndex =>
      day >= 0 && day <= 6 && Number.isInteger(day),
    )
    .sort((a, b) => a - b);
}

export function taskOccursOnDate(
  task: Task,
  isoDate: string,
  weekdayIndex: WeekdayIndex,
): boolean {
  if (task.schedule_type === "one_off") {
    return task.one_off_date === isoDate;
  }

  return taskWeekdays(task).includes(weekdayIndex);
}

export function expandTasksForWeek(
  tasks: Task[],
  weekDates: WeekDate[],
  completions: CompletionWithChecker[],
): TaskOccurrence[] {
  const completionMap = completionByOccurrence(completions);
  const occurrences: TaskOccurrence[] = [];

  for (const day of weekDates) {
    for (const task of tasks) {
      if (!taskOccursOnDate(task, day.iso, day.weekdayIndex)) {
        continue;
      }

      occurrences.push({
        id: completionKey(task.id, day.iso),
        task,
        occurrenceDate: day.iso,
        weekdayIndex: day.weekdayIndex,
        completion: completionMap.get(completionKey(task.id, day.iso)),
      });
    }
  }

  return occurrences;
}

export function monthDatesContaining(isoDate: string): string[] {
  const seed = new Date(`${isoDate}T12:00:00Z`);
  const year = seed.getUTCFullYear();
  const month = seed.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1, 12));
  const last = new Date(Date.UTC(year, month + 1, 0, 12));
  const firstWeekStart = getWeekStart(first);
  const lastWeekStart = getWeekStart(last);
  const dates: string[] = [];

  let current = firstWeekStart;
  const finalDate = isoDateAtOffset(lastWeekStart, 6);
  while (current <= finalDate) {
    dates.push(current);
    current = isoDateAtOffset(current, 1);
  }

  return dates;
}

export function monthLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

export function weekdayIndexForIso(isoDate: string): WeekdayIndex {
  const weekStart = getWeekStart(new Date(`${isoDate}T12:00:00Z`));
  const diff =
    (new Date(`${isoDate}T12:00:00Z`).getTime() -
      new Date(`${weekStart}T12:00:00Z`).getTime()) /
    MS_PER_DAY;
  if (diff < 0 || diff > 6 || !Number.isInteger(diff)) {
    throw new Error(`Invalid weekday for ${isoDate}`);
  }
  return diff as WeekdayIndex;
}
