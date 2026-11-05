import { describe, expect, it } from "vitest";
import type { CalEvent } from "../shared/types.js";
import { visibleEvents } from "../web/src/pages/Calendar.js";

function row(partial: Partial<CalEvent>): CalEvent {
  return {
    id: "e",
    title: "t",
    category: "Workout",
    startsAtUtc: "2026-11-09T06:00:00.000Z",
    durationMin: 45,
    notes: "",
    videoUrl: "",
    status: "scheduled",
    movedToUtc: null,
    createdBy: "hinata",
    updatedAtUtc: "2026-11-09T06:00:00.000Z",
    ...partial,
  };
}

describe("week view display filter", () => {
  it("hides moved rows but keeps scheduled, done and rested", () => {
    const events = [
      row({ id: "a", status: "scheduled" }),
      row({ id: "b", status: "moved" }),
      row({ id: "c", status: "done" }),
      row({ id: "d", status: "rested" }),
    ];
    expect(visibleEvents(events).map((e) => e.id)).toEqual(["a", "c", "d"]);
  });

  it("does not mutate the input array", () => {
    const events = [row({ id: "b", status: "moved" })];
    visibleEvents(events);
    expect(events).toHaveLength(1);
  });
});
