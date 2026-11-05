import { describe, expect, it } from "vitest";
import { birthdayEventsForRange } from "../shared/birthdays.js";

describe("yearly birthdays", () => {
  it("shows Simone's birthday (Feb 11) in its week, English title, General, all-day", () => {
    const events = birthdayEventsForRange("2026-02-09T00:00:00.000Z", "2026-02-16T00:00:00.000Z");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      title: "Simone's birthday",
      category: "General",
      startsAtUtc: "2026-02-11T00:00:00.000Z",
      durationMin: 1440,
      status: "scheduled",
    });
  });

  it("shows Hinata's birthday (May 6) in its week", () => {
    const events = birthdayEventsForRange("2026-05-04T00:00:00.000Z", "2026-05-11T00:00:00.000Z");
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Hinata's birthday");
    expect(events[0].startsAtUtc).toBe("2026-05-06T00:00:00.000Z");
  });

  it("repeats every year without re-registration", () => {
    for (const year of [2026, 2027, 2030]) {
      const feb = birthdayEventsForRange(`${year}-02-09T00:00:00.000Z`, `${year}-02-16T00:00:00.000Z`);
      expect(feb.map((e) => e.title)).toContain("Simone's birthday");
      const may = birthdayEventsForRange(`${year}-05-04T00:00:00.000Z`, `${year}-05-11T00:00:00.000Z`);
      expect(may.map((e) => e.title)).toContain("Hinata's birthday");
    }
  });

  it("spans a year-boundary week correctly", () => {
    const events = birthdayEventsForRange("2026-12-28T00:00:00.000Z", "2027-01-04T00:00:00.000Z");
    expect(events).toHaveLength(0);
    const feb = birthdayEventsForRange("2027-02-08T00:00:00.000Z", "2027-02-15T00:00:00.000Z");
    expect(feb).toHaveLength(1);
    expect(feb[0].id).toContain("2027");
  });

  it("shows nothing in weeks without birthdays", () => {
    expect(birthdayEventsForRange("2026-11-09T00:00:00.000Z", "2026-11-16T00:00:00.000Z")).toHaveLength(0);
  });
});
