import { describe, expect, it } from "vitest";
import { dualTime, formatDayOffset, formatInZone } from "../shared/time.js";

describe("timezone conversion", () => {
  it("winter: JST is UTC+9, Germany is UTC+1", () => {
    const fH = formatInZone("2026-01-15T12:00:00.000Z", "Asia/Tokyo");
    const fS = formatInZone("2026-01-15T12:00:00.000Z", "Europe/Berlin");
    expect(fH).toEqual({ date: "2026-01-15", time: "21:00" });
    expect(fS).toEqual({ date: "2026-01-15", time: "13:00" });
  });

  it("summer: Germany observes DST (UTC+2) while JST stays UTC+9", () => {
    const fH = formatInZone("2026-07-15T12:00:00.000Z", "Asia/Tokyo");
    const fS = formatInZone("2026-07-15T12:00:00.000Z", "Europe/Berlin");
    expect(fH).toEqual({ date: "2026-07-15", time: "21:00" });
    expect(fS).toEqual({ date: "2026-07-15", time: "14:00" });
  });

  it("labels use names, never Berlin", () => {
    const d = dualTime("2026-01-15T12:00:00.000Z", "simone");
    expect(d.mine.label).toBe("Simone's time");
    expect(d.theirs.label).toBe("Hinata's time");
    expect(JSON.stringify(d)).not.toContain("Berlin");
  });

  it("day crossing shows +1 day note", () => {
    // 15:00Z = midnight in Tokyo next day, still 16:00 in Germany
    const d = dualTime("2026-01-15T15:00:00.000Z", "simone");
    expect(d.mine.date).toBe("2026-01-15");
    expect(d.theirs.date).toBe("2026-01-16");
    expect(d.dayOffsetNote).toBe("+1 day");
  });

  it("formats multi-day offsets", () => {
    expect(formatDayOffset(0)).toBeNull();
    expect(formatDayOffset(2)).toBe("+2 days");
    expect(formatDayOffset(-1)).toBe("-1 day");
  });
});
