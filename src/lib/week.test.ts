import { describe, it, expect } from "vitest";
import { getWeekStart } from "./week";

describe("getWeekStart (America/New_York, Monday-start weeks)", () => {
  it("returns the same Monday for a mid-week date", () => {
    // Wednesday 2024-01-03 (noon UTC => morning in NY, same calendar day).
    expect(getWeekStart(new Date("2024-01-03T12:00:00Z"))).toBe("2024-01-01");
  });

  it("treats Sunday as the prior Monday's week", () => {
    // Sunday 2024-01-07 -> Monday 2024-01-01.
    expect(getWeekStart(new Date("2024-01-07T12:00:00Z"))).toBe("2024-01-01");
  });

  it("returns itself when the date is a Monday", () => {
    // Monday 2024-01-01 -> 2024-01-01.
    expect(getWeekStart(new Date("2024-01-01T12:00:00Z"))).toBe("2024-01-01");
  });

  it("handles the spring-forward DST changeover week", () => {
    // US spring-forward 2024 happened Sunday 2024-03-10. That week's Monday is
    // 2024-03-04. Every day in the week resolves to the same Monday.
    expect(getWeekStart(new Date("2024-03-04T12:00:00Z"))).toBe("2024-03-04"); // Mon
    expect(getWeekStart(new Date("2024-03-06T12:00:00Z"))).toBe("2024-03-04"); // Wed
    expect(getWeekStart(new Date("2024-03-10T12:00:00Z"))).toBe("2024-03-04"); // Sun (DST day)
    // The next Monday after the change starts a fresh week.
    expect(getWeekStart(new Date("2024-03-11T12:00:00Z"))).toBe("2024-03-11");
  });

  it("handles the fall-back DST changeover week", () => {
    // US fall-back 2024 happened Sunday 2024-11-03. That week's Monday is 2024-10-28.
    expect(getWeekStart(new Date("2024-10-28T12:00:00Z"))).toBe("2024-10-28"); // Mon
    expect(getWeekStart(new Date("2024-11-03T12:00:00Z"))).toBe("2024-10-28"); // Sun (DST day)
  });

  it("uses NY local calendar day, not UTC, at the day boundary", () => {
    // 2024-03-11T03:30:00Z is 23:30 on Sun 2024-03-10 in NY (EDT, UTC-4).
    // UTC would (wrongly) see Monday 2024-03-11; NY correctly sees the prior week.
    expect(getWeekStart(new Date("2024-03-11T03:30:00Z"))).toBe("2024-03-04");
  });

  it("uses NY local calendar day at the standard-time boundary", () => {
    // 2024-01-01T04:30:00Z is 23:30 on Sun 2023-12-31 in NY (EST, UTC-5).
    // NY week starts Monday 2023-12-25.
    expect(getWeekStart(new Date("2024-01-01T04:30:00Z"))).toBe("2023-12-25");
  });

  it("throws on an invalid date", () => {
    expect(() => getWeekStart(new Date("not-a-date"))).toThrow();
  });
});
