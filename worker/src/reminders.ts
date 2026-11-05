import { SIMONE_TZ } from "../../shared/types.js";
import { zonedDateKey } from "../../shared/time.js";
import type { Env } from "./auth.js";
import { sendPush } from "./push.js";

export async function eventsForSimoneDate(env: Env, dateKey: string): Promise<{ title: string; startsAtUtc: string; category: string }[]> {
  const rows = await env.DB.prepare(
    `SELECT title, starts_at_utc AS startsAtUtc, category FROM events WHERE status = 'scheduled' ORDER BY starts_at_utc ASC LIMIT 200`,
  ).all<{ title: string; startsAtUtc: string; category: string }>();
  return (rows.results ?? []).filter((e) => zonedDateKey(e.startsAtUtc, SIMONE_TZ) === dateKey);
}

export async function simoneTargets(env: Env): Promise<{ endpoint: string; p256dh: string; auth: string }[]> {
  const rows = await env.DB.prepare(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE role = 'simone'",
  ).all<{ endpoint: string; p256dh: string; auth: string }>();
  return rows.results ?? [];
}

export async function runDailyReminder(env: Env, nowUtc: Date): Promise<{ sent: number; events: number }> {
  const dateKey = zonedDateKey(nowUtc.toISOString(), SIMONE_TZ);
  const todays = (await eventsForSimoneDate(env, dateKey)).filter(
    (e) => e.category === "Workout" || e.category === "Jogging",
  );
  if (todays.length === 0) return { sent: 0, events: 0 };
  const targets = await simoneTargets(env);
  const payload = {
    title: "Today's workout 💪",
    body: todays.map((e) => e.title).join(" / ").slice(0, 140),
    url: "/",
  };
  let sent = 0;
  for (const t of targets) {
    if (await sendPush(env, t, payload)) sent++;
  }
  return { sent, events: todays.length };
}

export async function runWeightReminder(env: Env): Promise<{ sent: number }> {
  const targets = await simoneTargets(env);
  const payload = { title: "Weight check-in", body: "Time for your Saturday weight entry ⚖️", url: "/weight" };
  let sent = 0;
  for (const t of targets) {
    if (await sendPush(env, t, payload)) sent++;
  }
  return { sent };
}
