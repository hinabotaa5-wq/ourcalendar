import { describe, expect, it } from "vitest";
import {
  feasibleKinds,
  isoWeekKey,
  levelForXp,
  pickQuestKind,
  questProgress,
  questWeekKey,
  weekStartUtc,
  xpForDone,
  type QuestEvent,
} from "../shared/game.js";

const ev = (partial: Partial<QuestEvent> & { id: string }): QuestEvent => ({
  category: "Workout",
  status: "scheduled",
  weekdayMon0: 0,
  ...partial,
});

describe("levelForXp", () => {
  it("computes levels at boundaries", () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(99)).toMatchObject({ level: 1, nextAt: 100, remaining: 1 });
    expect(levelForXp(100)).toMatchObject({ level: 2, baseXp: 100, nextAt: 250 });
    expect(levelForXp(249).level).toBe(2);
    expect(levelForXp(250).level).toBe(3);
    expect(levelForXp(999).level).toBe(5);
    expect(levelForXp(1000)).toMatchObject({ level: 6, baseXp: 1000, nextAt: 1300 });
    expect(levelForXp(1300)).toMatchObject({ level: 7, nextAt: 1600 });
    expect(levelForXp(1600).level).toBe(8);
  });
});

describe("xpForDone", () => {
  it("pays 40/60 and nothing for the rest", () => {
    expect(xpForDone("Workout")).toBe(40);
    expect(xpForDone("Jogging")).toBe(60);
    expect(xpForDone("General")).toBe(0);
    expect(xpForDone("Rest")).toBe(0);
  });
});

describe("quest week keys", () => {
  it("uses ISO week numbering", () => {
    expect(isoWeekKey(new Date("2026-11-06T00:00:00Z"))).toBe("2026-W45");
  });
  it("is stable within one display week, either week start", () => {
    const keyFor = (d: Date, ws: 0 | 1) => questWeekKey(weekStartUtc(d, ws), ws);
    expect(keyFor(new Date("2026-11-09T00:00:00Z"), 1)).toBe(keyFor(new Date("2026-11-15T00:00:00Z"), 1));
    expect(keyFor(new Date("2026-11-08T00:00:00Z"), 0)).toBe(keyFor(new Date("2026-11-14T00:00:00Z"), 0));
    expect(keyFor(new Date("2026-11-08T00:00:00Z"), 0)).toBe("2026-W46");
  });
});

describe("pickQuestKind", () => {
  it("is deterministic per week key", () => {
    const kinds = ["clear_all", "jog_once", "done_count", "weekday_once"] as const;
    const a = pickQuestKind("2026-W45", [...kinds], null);
    expect(pickQuestKind("2026-W45", [...kinds], null)).toBe(a);
  });
  it("avoids last week's kind when alternatives exist", () => {
    const kinds = ["clear_all", "jog_once"] as const;
    for (const wk of ["2026-W40", "2026-W41", "2026-W42", "2027-W03", "2028-W20"]) {
      expect(pickQuestKind(wk, [...kinds], "clear_all")).toBe("jog_once");
    }
  });
  it("keeps the only candidate even if it matches last week", () => {
    expect(pickQuestKind("2026-W45", ["jog_once"], "jog_once")).toBe("jog_once");
  });
  it("returns null when nothing is feasible", () => {
    expect(pickQuestKind("2026-W45", [], null)).toBeNull();
  });
});

describe("feasibleKinds", () => {
  it("excludes jog_once without jogging and everything without events", () => {
    expect(feasibleKinds({ hasWorkoutOrJogging: false, hasJogging: false, workoutJoggingCount: 0, hasWeekday: false })).toEqual([]);
    expect(
      feasibleKinds({ hasWorkoutOrJogging: true, hasJogging: false, workoutJoggingCount: 2, hasWeekday: true }),
    ).toEqual(["clear_all", "done_count", "weekday_once"]);
  });
});

describe("questProgress", () => {
  it("clear_all counts Rest as cleared but needs everything handled", () => {
    const events = [ev({ id: "a", status: "done" }), ev({ id: "b", status: "rested" }), ev({ id: "c" })];
    const p = questProgress("clear_all", events);
    expect(p).toMatchObject({ target: 3, done: 2, achieved: false });
    expect(
      questProgress("clear_all", [ev({ id: "a", status: "done" }), ev({ id: "b", status: "rested" })]),
    ).toMatchObject({ achieved: true });
  });
  it("jog_once needs one done jogging", () => {
    expect(questProgress("jog_once", [ev({ id: "a", category: "Jogging" })]).achieved).toBe(false);
    expect(questProgress("jog_once", [ev({ id: "a", category: "Jogging", status: "done" })])).toMatchObject({
      achieved: true,
      done: 1,
    });
  });
  it("done_count targets min(3, events)", () => {
    const five = Array.from({ length: 5 }, (_, i) => ev({ id: `e${i}`, status: i < 3 ? "done" : "scheduled" }));
    expect(questProgress("done_count", five)).toMatchObject({ target: 3, done: 3, achieved: true });
    const two = [ev({ id: "a", status: "done" }), ev({ id: "b" })];
    expect(questProgress("done_count", two)).toMatchObject({ target: 2, achieved: false });
  });
  it("weekday_once ignores weekend dones", () => {
    expect(questProgress("weekday_once", [ev({ id: "a", status: "done", weekdayMon0: 5 })]).achieved).toBe(false);
    expect(questProgress("weekday_once", [ev({ id: "a", status: "done", weekdayMon0: 4 })]).achieved).toBe(true);
  });
});
