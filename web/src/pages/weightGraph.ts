import type { WeightEntry } from "../../../shared/types.js";

// Canvas size (SVG viewBox units). The chart stretches to full width via
// viewBox responsiveness; the height stays around 150px at typical widths.
export const GRAPH_W = 320;
export const GRAPH_H = 150;
export const PAD_L = 38;
export const PAD_R = 48;
export const PAD_T = 16;
export const PAD_B = 22;

export interface GraphPoint {
  x: number;
  y: number;
  entry: WeightEntry;
}

export interface WeightGraph {
  points: GraphPoint[];
  /** Actual data min/max (used for axis labels). */
  min: number;
  max: number;
  /** Padded scale bounds (used for positioning). Always lo < hi. */
  lo: number;
  hi: number;
}

/** Sort entries oldest-first without mutating the input. */
export function sortWeightsAsc(weights: WeightEntry[]): WeightEntry[] {
  return [...weights].sort((a, b) =>
    a.recordedAtUtc < b.recordedAtUtc ? -1 : a.recordedAtUtc > b.recordedAtUtc ? 1 : 0,
  );
}

/** Format an ISO UTC timestamp as M/D. */
export function formatMD(isoUtc: string): string {
  const d = new Date(isoUtc);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

/**
 * Build chart geometry for weight history. Returns null for empty input.
 * Single-entry input yields one centered point (no line); the padded scale
 * guarantees hi > lo so no division by zero is possible.
 */
export function buildWeightGraph(weights: WeightEntry[]): WeightGraph | null {
  if (weights.length === 0) return null;
  const sorted = sortWeightsAsc(weights);
  const values = sorted.map((w) => w.valueKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const pad = range > 0 ? Math.max(range * 0.25, 0.5) : 1;
  const lo = min - pad;
  const hi = max + pad;
  const innerW = GRAPH_W - PAD_L - PAD_R;
  const innerH = GRAPH_H - PAD_T - PAD_B;
  const points = sorted.map((entry, i): GraphPoint => {
    const x = sorted.length === 1 ? PAD_L + innerW / 2 : PAD_L + (i * innerW) / (sorted.length - 1);
    const y = PAD_T + innerH - ((entry.valueKg - lo) / (hi - lo)) * innerH;
    return { x, y, entry };
  });
  return { points, min, max, lo, hi };
}
