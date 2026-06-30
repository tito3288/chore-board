/** Display formatting helpers (all in America/New_York to match the week math). */

const NY_TZ = "America/New_York";

/** e.g. "Mon 7:45 PM" — when a check-off happened, in NY local time. */
export function formatCheckTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * e.g. "Week of Mon Jun 30" — label for a week-start ISO date (YYYY-MM-DD).
 * Formatted at noon UTC so the calendar date renders without TZ drift.
 */
export function formatWeekLabel(weekStart: string): string {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${weekStart}T12:00:00Z`));
  return `Week of ${label}`;
}
