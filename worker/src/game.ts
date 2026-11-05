import { LOCALES } from "../../shared/i18n.js";
import { TIME_ZONES, zonedDateOf } from "../../shared/time.js";
import type { Role } from "../../shared/types.js";
import {
  QUEST_BONUS_XP,
  feasibleKinds,
  levelForXp,
  pickQuestKind,
  questProgress,
  questWeekKey,
  weekStartUtc,
  xpForDone,
  type QuestKind,
} from "../../shared/game.js";
import type { Env } from "./auth.js";
import { getLanguage } from "./reminders.js";

import type { GameView } from "../../shared/game.js";

interface GameRow {
  total_xp: number;
  quest_week_key: string | null;
  quest_kind: QuestKind | null;
  last_quest_kind: QuestKind | null;
}

export async function getGameRow(env: Env): Promise<GameRow> {
  const row = await env.DB.prepare("SELECT total_xp, quest_week_key, quest_kind, last_quest_kind FROM game_state WHERE id = 1").first<GameRow>();
  if (row) return row;
  await env.DB.prepare("INSERT OR IGNORE INTO game_state (id, total_xp) VALUES (1, 0)").run();
  return { total_xp: 0, quest_week_key: null, quest_kind: null, last_quest_kind: null };
}

/** Idempotent XP grant. Returns true when this call actually added XP. */
export async function addXp(env: Env, key: string, xp: number): Promise<boolean> {
  if (xp <= 0) return false;
  const now = new Date().toISOString();
  const res = await env.DB.prepare("INSERT OR IGNORE INTO xp_events (key, xp, created_at) VALUES (?, ?, ?)")
    .bind(key, xp, now)
    .run();
  const changed = (res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
  if (changed === 0) return false;
  await env.DB.prepare("UPDATE game_state SET total_xp = total_xp + ? WHERE id = 1").bind(xp).run();
  return true;
}

export async function bonusAwarded(env: Env, weekKey: string): Promise<boolean> {
  const row = await env.DB.prepare("SELECT key FROM xp_events WHERE key = ?").bind(`quest:${weekKey}`).first();
  return row !== null;
}

function questEventsFrom(rows: { id: string; category: string; status: string; startsAtUtc: string }[]): {
  id: string;
  category: string;
  status: string;
  weekdayMon0: number;
}[] {
  return rows.map((r) => {
    const zoned = zonedDateOf(r.startsAtUtc, "simone");
    const dowSun0 = new Date(`${zoned}T00:00:00Z`).getUTCDay();
    return { id: r.id, category: r.category, status: r.status, weekdayMon0: (dowSun0 + 6) % 7 };
  });
}

/**
 * Ensure the current week's quest exists, compute progress, and (only when
 * grantBonus is true, i.e. triggered by a Done action) award the weekly
 * +50 XP bonus on first achievement. XP otherwise enters only via Done.
 */
export async function syncQuest(env: Env, now: Date, grantBonus: boolean): Promise<GameView> {
  const simoneLang = await getLanguage(env, "simone");
  const ws = LOCALES[simoneLang].weekStart;
  const start = weekStartUtc(now, ws);
  const key = questWeekKey(start, ws);
  const end = new Date(start.getTime() + 7 * 86400000);

  const rows = await env.DB.prepare(
    `SELECT id, category, status, starts_at_utc AS startsAtUtc FROM events
     WHERE starts_at_utc >= ? AND starts_at_utc < ? AND category IN ('Workout','Jogging') AND status != 'moved'`,
  )
    .bind(start.toISOString(), end.toISOString())
    .all<{ id: string; category: string; status: string; startsAtUtc: string }>();
  const events = questEventsFrom(rows.results ?? []);

  const state = await getGameRow(env);
  let kind = state.quest_week_key === key ? state.quest_kind : null;
  if (kind === null) {
    const f = {
      hasWorkoutOrJogging: events.length > 0,
      hasJogging: events.some((e) => e.category === "Jogging"),
      workoutJoggingCount: events.length,
      hasWeekday: events.some((e) => e.weekdayMon0 <= 4),
    };
    kind = pickQuestKind(key, feasibleKinds(f), state.quest_week_key === key ? null : state.last_quest_kind);
    if (kind) {
      await env.DB.prepare("UPDATE game_state SET quest_week_key = ?, quest_kind = ?, last_quest_kind = ? WHERE id = 1")
        .bind(key, kind, state.quest_kind)
        .run();
    } else {
      await env.DB.prepare("UPDATE game_state SET quest_week_key = ?, quest_kind = NULL WHERE id = 1").bind(key).run();
    }
  }

  const totalRow = await getGameRow(env);
  if (!kind) {
    return { totalXp: totalRow.total_xp, level: levelForXp(totalRow.total_xp), quest: null };
  }
  const progress = questProgress(kind, events);
  if (progress.achieved && grantBonus) {
    await addXp(env, `quest:${key}`, QUEST_BONUS_XP);
  }
  const finalRow = await getGameRow(env);
  return {
    totalXp: finalRow.total_xp,
    level: levelForXp(finalRow.total_xp),
    quest: { weekKey: key, kind, progress, bonusAwarded: await bonusAwarded(env, key) },
  };
}

/** Today-only Done check in the pressing player's own timezone. */
export function doneAllowedFor(startsAtUtc: string, role: Role, now: Date): boolean {
  const tz = TIME_ZONES[role];
  return zonedDateOf(startsAtUtc, role === "simone" ? "simone" : "hinata") === zonedToday(tz, now);
}

function zonedToday(tz: string, now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export { xpForDone };
