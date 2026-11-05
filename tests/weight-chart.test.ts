import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../shared/types.js";
import {
  buildWeightGraph,
  formatMD,
  GRAPH_H,
  GRAPH_W,
  PAD_B,
  PAD_L,
  PAD_R,
  PAD_T,
} from "../web/src/pages/weightGraph.js";

const entry = (id: string, recordedAtUtc: string, valueKg: number): WeightEntry => ({
  id,
  recordedAtUtc,
  valueKg,
});

describe("weight graph geometry", () => {
  it("returns null for empty history", () => {
    expect(buildWeightGraph([])).toBeNull();
  });

  it("sorts oldest-first even when the API returns newest-first", () => {
    const g = buildWeightGraph([
      entry("b", "2026-11-14T10:00:00.000Z", 52.0),
      entry("a", "2026-11-07T10:00:00.000Z", 53.0),
    ])!;
    expect(g.points.map((p) => p.entry.id)).toEqual(["a", "b"]);
    expect(g.points[0].x).toBeLessThan(g.points[1].x);
  });

  it("does not mutate the input array", () => {
    const input = [
      entry("b", "2026-11-14T10:00:00.000Z", 52.0),
      entry("a", "2026-11-07T10:00:00.000Z", 53.0),
    ];
    buildWeightGraph(input);
    expect(input[0].id).toBe("b");
  });

  it("single entry yields one finite centered point (no division by zero)", () => {
    const g = buildWeightGraph([entry("only", "2026-11-07T10:00:00.000Z", 52.3)])!;
    expect(g.points).toHaveLength(1);
    expect(Number.isFinite(g.points[0].x)).toBe(true);
    expect(Number.isFinite(g.points[0].y)).toBe(true);
    expect(g.points[0].x).toBeCloseTo(PAD_L + (GRAPH_W - PAD_L - PAD_R) / 2);
    expect(g.points[0].y).toBeCloseTo(PAD_T + (GRAPH_H - PAD_T - PAD_B) / 2);
    expect(g.hi).toBeGreaterThan(g.lo);
  });

  it("pads the vertical scale and keeps points inside the canvas", () => {
    const g = buildWeightGraph([
      entry("a", "2026-11-07T10:00:00.000Z", 52.0),
      entry("b", "2026-11-14T10:00:00.000Z", 53.0),
    ])!;
    expect(g.min).toBe(52.0);
    expect(g.max).toBe(53.0);
    expect(g.lo).toBeLessThan(52.0);
    expect(g.hi).toBeGreaterThan(53.0);
    for (const p of g.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(GRAPH_W);
      expect(p.y).toBeGreaterThan(PAD_T);
      expect(p.y).toBeLessThan(GRAPH_H - PAD_B);
    }
    // Higher value maps higher up (smaller y).
    expect(g.points[1].y).toBeLessThan(g.points[0].y);
  });

  it("formats UTC dates as M/D", () => {
    expect(formatMD("2026-11-07T10:00:00.000Z")).toBe("11/7");
    expect(formatMD("2026-01-05T23:00:00.000Z")).toBe("1/5");
  });
});
