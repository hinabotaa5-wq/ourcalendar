import { describe, expect, it } from "vitest";
import { monthGrid, monthKey, shiftMonth } from "../shared/month.js";

describe("monthGrid", () => {
  it("starts Sunday-first grids on Sunday (Nov 2026)", () => {
    const weeks = monthGrid(2026, 11, 0, "2026-11-06");
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toMatchObject({ date: "2026-11-01", inMonth: true });
    expect(weeks.flat().filter((c) => c.inMonth)).toHaveLength(30);
    const today = weeks.flat().find((c) => c.isToday);
    expect(today?.date).toBe("2026-11-06");
  });

  it("starts Monday-first grids on Monday (Feb 2026, Polish style)", () => {
    // Feb 1 2026 is a Sunday; Monday-start grid opens on Jan 26.
    const weeks = monthGrid(2026, 2, 1);
    expect(weeks[0][0]).toMatchObject({ date: "2026-01-26", inMonth: false });
    expect(weeks[0][6]).toMatchObject({ date: "2026-02-01", inMonth: true });
    expect(weeks.flat().filter((c) => c.inMonth)).toHaveLength(28);
  });

  it("places birthdays in the right cells", () => {
    const inMonth = (y: number, m: number, ws: 0 | 1) => monthGrid(y, m, ws).flat().filter((c) => c.inMonth);
    expect(inMonth(2026, 2, 0).some((c) => c.date === "2026-02-11")).toBe(true);
    expect(inMonth(2027, 5, 1).some((c) => c.date === "2027-05-06")).toBe(true);
  });
});

describe("month helpers", () => {
  it("shifts across year boundaries", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(monthKey(2026, 2)).toBe("2026-02");
  });
});
