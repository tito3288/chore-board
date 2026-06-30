/**
 * Week-math single source of truth.
 *
 * The household's week boundary is Monday 00:00 in America/New_York (hardcoded).
 * `getWeekStart` returns the ISO date (YYYY-MM-DD) of the Monday of the week that
 * contains the given instant, as observed in America/New_York. Sunday counts as
 * the prior Monday's week.
 *
 * ALL week math in the app must go through this helper.
 */

const NY_TZ = "America/New_York";

/** Monday = 0, Tuesday = 1, ... Sunday = 6. */
const WEEKDAY_OFFSET: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

const MS_PER_DAY = 86_400_000;

/**
 * Returns the ISO date (YYYY-MM-DD) of the Monday that starts the
 * America/New_York week containing `date`.
 */
export function getWeekStart(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("getWeekStart: expected a valid Date");
  }

  // Resolve the calendar date + weekday as seen in America/New_York for this instant.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const pick = (type: string): string => {
    const found = parts.find((p) => p.type === type);
    if (!found) {
      throw new Error(`getWeekStart: missing date part "${type}"`);
    }
    return found.value;
  };

  const year = Number(pick("year"));
  const month = Number(pick("month"));
  const day = Number(pick("day"));
  const weekdayName = pick("weekday");

  const offset = WEEKDAY_OFFSET[weekdayName];
  if (offset === undefined) {
    throw new Error(`getWeekStart: unrecognised weekday "${weekdayName}"`);
  }

  // Pure calendar arithmetic in UTC space — safe from DST because we operate on
  // the already-resolved NY calendar date, not on a wall-clock instant.
  const base = Date.UTC(year, month - 1, day);
  const monday = new Date(base - offset * MS_PER_DAY);

  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(monday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
