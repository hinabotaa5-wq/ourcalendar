export type QuestKind = "clear_all" | "jog_once" | "done_count" | "weekday_once";
export const QUEST_KINDS: QuestKind[] = ["clear_all", "jog_once", "done_count", "weekday_once"];

export const QUEST_BONUS_XP = 50;
export const XP_WORKOUT = 40;
export const XP_JOGGING = 60;

const BASE_THRESHOLDS = [100, 250, 450, 700, 1000];
const STEP = 300;

export interface LevelInfo {
  level: number;
  baseXp: number;
  nextAt: number;
  remaining: number;
}

export function levelForXp(totalXp: number): LevelInfo {
  let level = 1;
  let base = 0;
  let next = BASE_THRESHOLDS[0];
  let i = 0;
  while (totalXp >= next) {
    level++;
    base = next;
    i++;
    next = i < BASE_THRESHOLDS.length ? BASE_THRESHOLDS[i] : next + STEP;
  }
  return { level, baseXp: base, nextAt: next, remaining: next - totalXp };
}

export function xpForDone(category: string): number {
  if (category === "Jogging") return XP_JOGGING;
  if (category === "Workout") return XP_WORKOUT;
  return 0;
}

/** ISO week key (e.g. "2026-W46") of a UTC date. */
export function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Week key seeded from the week's Thursday (ISO weeks are defined by it),
 * so the same display week always maps to one ISO week key regardless of
 * the configured week start (0 = Sunday, 1 = Monday).
 */
export function questWeekKey(weekStartUtc: Date, weekStart: 0 | 1): string {
  const toThursday = (3 - ((weekStart + 6) % 7) + 7) % 7;
  return isoWeekKey(new Date(weekStartUtc.getTime() + toThursday * 86400000));
}

/** UTC midnight of the week start containing the given date. */
export function weekStartUtc(date: Date, weekStart: 0 | 1): Date {
  const dowSun0 = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getUTCDay();
  const lead = (dowSun0 - weekStart + 7) % 7;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - lead));
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pick from feasible kinds; avoids last week's kind when alternatives exist. */
export function pickQuestKind(weekKey: string, feasible: QuestKind[], lastKind: QuestKind | null): QuestKind | null {
  if (feasible.length === 0) return null;
  const pool = feasible.length > 1 && lastKind && feasible.includes(lastKind) ? feasible.filter((k) => k !== lastKind) : feasible;
  return pool[hashSeed(`quest:${weekKey}`) % pool.length];
}

export interface QuestEvent {
  id: string;
  category: string;
  status: string;
  weekdayMon0: number;
}

export interface QuestProgress {
  target: number;
  done: number;
  achieved: boolean;
  perEvent: { id: string; state: "flower" | "zzz" | "sprout" }[];
}

function eventState(e: QuestEvent): "flower" | "zzz" | "sprout" {
  if (e.status === "done") return "flower";
  if (e.status === "rested") return "zzz";
  return "sprout";
}

/** Progress for one quest kind over the week's Workout/Jogging events (moved excluded upstream). */
export function questProgress(kind: QuestKind, events: QuestEvent[]): QuestProgress {
  const perEvent = events.map((e) => ({ id: e.id, state: eventState(e) }));
  switch (kind) {
    case "clear_all": {
      const achieved = events.length > 0 && events.every((e) => e.status === "done" || e.status === "rested");
      return { target: events.length, done: events.filter((e) => e.status === "done" || e.status === "rested").length, achieved, perEvent };
    }
    case "jog_once": {
      const done = events.filter((e) => e.category === "Jogging" && e.status === "done").length;
      return { target: 1, done: Math.min(done, 1), achieved: done >= 1, perEvent };
    }
    case "done_count": {
      const target = Math.min(3, events.length);
      const done = events.filter((e) => e.status === "done").length;
      return { target, done: Math.min(done, target), achieved: target > 0 && done >= target, perEvent };
    }
    case "weekday_once": {
      const done = events.filter((e) => e.status === "done" && e.weekdayMon0 <= 4).length;
      return { target: 1, done: Math.min(done, 1), achieved: done >= 1, perEvent };
    }
  }
}

export interface GameQuestView {
  weekKey: string;
  kind: QuestKind;
  progress: QuestProgress;
  bonusAwarded: boolean;
}

export interface GameView {
  totalXp: number;
  level: LevelInfo;
  quest: GameQuestView | null;
}

export interface FeasibleInput {
  hasWorkoutOrJogging: boolean;
  hasJogging: boolean;
  workoutJoggingCount: number;
  hasWeekday: boolean;
}

/** Which kinds can be achieved given this week's plan. */
export function feasibleKinds(f: FeasibleInput): QuestKind[] {
  const out: QuestKind[] = [];
  if (f.hasWorkoutOrJogging) out.push("clear_all", "done_count");
  if (f.hasJogging) out.push("jog_once");
  if (f.hasWeekday) out.push("weekday_once");
  return out;
}
