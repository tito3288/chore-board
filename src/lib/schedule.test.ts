import { describe, expect, it } from "vitest";
import {
  completionKey,
  expandTasksForWeek,
  monthDatesContaining,
  taskOccursOnDate,
  weekDatesFromStart,
  weekdayIndexForIso,
} from "./schedule";
import type { CompletionWithChecker, Task } from "./types";

function task(overrides: Partial<Task>): Task {
  return {
    id: "task-1",
    title: "Run dishwasher",
    notes: null,
    sort_order: 1,
    is_active: true,
    created_at: "2026-07-01T12:00:00Z",
    schedule_type: "recurring",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    one_off_date: null,
    ...overrides,
  };
}

function completion(
  taskId: string,
  occurrenceDate: string,
): CompletionWithChecker {
  return {
    id: `${taskId}-${occurrenceDate}`,
    task_id: taskId,
    week_start: "2026-06-29",
    occurrence_date: occurrenceDate,
    completed_by: "user-1",
    completed_at: "2026-07-01T12:00:00Z",
    note: null,
    checker_name: "Bryan",
  };
}

describe("schedule helpers", () => {
  it("builds Monday-Sunday dates from a week start", () => {
    const dates = weekDatesFromStart("2026-06-29");

    expect(dates.map((date) => date.iso)).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
    ]);
  });

  it("expands recurring chores only on selected weekdays", () => {
    const dates = weekDatesFromStart("2026-06-29");
    const recurring = task({ weekdays: [0, 2, 4] });
    const occurrences = expandTasksForWeek([recurring], dates, []);

    expect(occurrences.map((item) => item.occurrenceDate)).toEqual([
      "2026-06-29",
      "2026-07-01",
      "2026-07-03",
    ]);
  });

  it("shows one-off chores only on their exact date", () => {
    const oneOff = task({
      schedule_type: "one_off",
      weekdays: [],
      one_off_date: "2026-07-04",
    });

    expect(taskOccursOnDate(oneOff, "2026-07-03", 4)).toBe(false);
    expect(taskOccursOnDate(oneOff, "2026-07-04", 5)).toBe(true);
  });

  it("keeps completions independent per occurrence date", () => {
    const dates = weekDatesFromStart("2026-06-29");
    const recurring = task({ id: "task-1", weekdays: [0, 1] });
    const completions = [completion("task-1", "2026-06-29")];
    const occurrences = expandTasksForWeek([recurring], dates, completions);

    expect(occurrences).toHaveLength(2);
    expect(occurrences[0]?.completion?.checker_name).toBe("Bryan");
    expect(occurrences[1]?.completion).toBeUndefined();
    expect(completionKey("task-1", "2026-06-29")).not.toBe(
      completionKey("task-1", "2026-06-30"),
    );
  });

  it("builds a compact month grid around full Monday-start weeks", () => {
    const dates = monthDatesContaining("2026-07-02");

    expect(dates[0]).toBe("2026-06-29");
    expect(dates[dates.length - 1]).toBe("2026-08-02");
    expect(dates).toHaveLength(35);
  });

  it("finds Monday-start weekday indexes for ISO dates", () => {
    expect(weekdayIndexForIso("2026-06-29")).toBe(0);
    expect(weekdayIndexForIso("2026-07-05")).toBe(6);
  });
});
