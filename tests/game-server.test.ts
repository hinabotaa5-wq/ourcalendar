import { describe, expect, it } from "vitest";
import { doneAllowedFor } from "../worker/src/game.js";
import { weekStartUtc } from "../shared/game.js";
import { handleFetch } from "../worker/src/index.js";
import type { Env } from "../worker/src/auth.js";

interface Ev {
  id: string;
  title: string;
  category: string;
  startsAtUtc: string;
  durationMin: number;
  notes: string;
  videoUrl: string;
  status: string;
}

function utcTodayPlus(days: number, hourUtc: number): string {
  const t = new Date(Date.now() + days * 86400000);
  return `${t.toISOString().slice(0, 10)}T${String(hourUtc).padStart(2, "0")}:00:00.000Z`;
}

function fakeDb(sessionRole: "hinata" | "simone" | null, seed: Ev[]) {
  const events = new Map(seed.map((e) => [e.id, { ...e }]));
  const game = { totalXp: 0, questWeekKey: null as string | null, questKind: null as string | null, lastQuestKind: null as string | null };
  const xpEvents = new Map<string, number>();
  const users = new Map<string, string>([["simone", "en"]]);

  const stmt = (sql: string) => {
    const bound = (...args: unknown[]) => ({
      first: async <T>(): Promise<T | null> => {
        if (sql.startsWith("SELECT id, role FROM sessions")) {
          return sessionRole ? ({ id: "s", role: sessionRole } as unknown as T) : null;
        }
        if (sql.includes("FROM events WHERE id")) {
          const e = events.get(String(args[0]));
          if (!e) return null;
          return { ...e, startsAtUtc: e.startsAtUtc, durationMin: e.durationMin, videoUrl: e.videoUrl } as unknown as T;
        }
        if (sql.includes("FROM game_state")) {
          return { total_xp: game.totalXp, quest_week_key: game.questWeekKey, quest_kind: game.questKind, last_quest_kind: game.lastQuestKind } as unknown as T;
        }
        if (sql.includes("FROM xp_events WHERE key")) {
          return xpEvents.has(String(args[0])) ? ({ key: args[0] } as unknown as T) : null;
        }
        if (sql.includes("FROM users")) {
          const lang = users.get(String(args[0]));
          return lang ? ({ language: lang } as unknown as T) : null;
        }
        return null;
      },
      all: async <T>(): Promise<{ results: T[] }> => {
        if (sql.includes("category IN ('Workout','Jogging')")) {
          const [from, to] = args as string[];
          const out = [...events.values()].filter(
            (e) => e.startsAtUtc >= from && e.startsAtUtc < to && (e.category === "Workout" || e.category === "Jogging") && e.status !== "moved",
          );
          return { results: out as unknown as T[] };
        }
        return { results: [] };
      },
      run: async () => {
        if (sql.startsWith("UPDATE events SET status")) {
          const e = events.get(String(args[3]));
          if (e) {
            e.status = String(args[0]);
          }
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("INSERT INTO events")) {
          const [id, title, category, startsAtUtc, durationMin, notes, videoUrl, createdBy] = args as (string | number)[];
          events.set(String(id), {
            id: String(id), title: String(title), category: String(category), startsAtUtc: String(startsAtUtc),
            durationMin: Number(durationMin), notes: String(notes), videoUrl: String(videoUrl), status: "scheduled",
          });
          void createdBy;
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("DELETE FROM events")) {
          events.delete(String(args[0]));
          return { meta: { changes: 1 } };
        }
        if (sql.includes("UPDATE game_state SET total_xp")) {
          game.totalXp += Number(args[0]);
          return { meta: { changes: 1 } };
        }
        if (sql.includes("quest_week_key")) {
          game.questWeekKey = String(args[0]);
          game.questKind = args[1] as string | null;
          game.lastQuestKind = args[2] as string | null;
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("INSERT OR IGNORE INTO xp_events")) {
          const key = String(args[0]);
          if (xpEvents.has(key)) return { meta: { changes: 0 } };
          xpEvents.set(key, Number(args[1]));
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("INSERT INTO users")) {
          users.set(String(args[0]), String(args[1]));
          return { meta: { changes: 1 } };
        }
        return { meta: { changes: 0 } };
      },
    });
    const direct = bound();
    return { bind: bound, first: direct.first, all: direct.all, run: direct.run };
  };
  const db = { prepare: stmt, batch: async () => [] } as unknown as D1Database;
  return { db, events, game, xpEvents };
}

const baseEnv = { VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "" } as Env;

function req(path: string, method: string, body?: unknown) {
  return new Request(`https://api.test${path}`, {
    method,
    headers: { cookie: "oc_session=s", "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const seedEv = (id: string, category: string, startsAtUtc: string, status = "scheduled"): Ev => ({
  id, title: id, category, startsAtUtc, durationMin: 45, notes: "", videoUrl: "", status,
});

async function gameTotal(db: D1Database): Promise<number> {
  const res = await handleFetch(req("/api/game", "GET"), { ...baseEnv, DB: db });
  const body = (await res.json()) as { totalXp: number; quest: { achieved?: boolean; progress?: { achieved: boolean }; bonusAwarded: boolean } | null };
  return body.totalXp;
}

describe("done XP and today-only rule", () => {
  it("awards Jogging 60 once, rejects other days, Rest and General pay nothing", async () => {
    const today = utcTodayPlus(0, 3);
    const { db } = fakeDb("simone", [
      seedEv("jog", "Jogging", today),
      seedEv("past", "Jogging", utcTodayPlus(-1, 3)),
      seedEv("future", "Workout", utcTodayPlus(1, 3)),
      seedEv("gen", "General", today),
    ]);
    const env = { ...baseEnv, DB: db };

    const done1 = await handleFetch(req("/api/events/jog/action", "POST", { action: "done" }), env);
    expect(done1.status).toBe(200);
    const g1 = (await done1.json()) as { game: { totalXp: number } };
    const bonus = g1.game.totalXp - 60;
    expect([0, 50]).toContain(bonus);

    // Re-done: idempotent, no more XP.
    await handleFetch(req("/api/events/jog/action", "POST", { action: "done" }), env);
    expect(await gameTotal(db)).toBe(g1.game.totalXp);

    // Other days rejected.
    expect((await handleFetch(req("/api/events/past/action", "POST", { action: "done" }), env)).status).toBe(400);
    expect((await handleFetch(req("/api/events/future/action", "POST", { action: "done" }), env)).status).toBe(400);
    expect(await gameTotal(db)).toBe(g1.game.totalXp);

    // Rest pays nothing even on today's event.
    const rest = await handleFetch(req("/api/events/future/action", "POST", { action: "rest" }), env);
    expect(rest.status).toBe(200);
    expect(await gameTotal(db)).toBe(g1.game.totalXp);

    // General done is allowed but pays nothing.
    const gen = await handleFetch(req("/api/events/gen/action", "POST", { action: "done" }), env);
    expect(gen.status).toBe(200);
    expect(await gameTotal(db)).toBe(g1.game.totalXp);
  });

  it("awards the weekly bonus once on rest-only clear_all, never more", async () => {
    const start = weekStartUtc(new Date(), 0);
    const sat = `${new Date(start.getTime() + 6 * 86400000).toISOString().slice(0, 10)}T03:00:00.000Z`;
    const { db, game } = fakeDb("simone", [seedEv("w1", "Workout", sat), seedEv("w2", "Workout", sat)]);
    game.lastQuestKind = "done_count";
    const env = { ...baseEnv, DB: db };
    const q0 = (await (await handleFetch(req("/api/game", "GET"), env)).json()) as {
      totalXp: number;
      quest: { kind: string; progress: { achieved: boolean } };
    };
    expect(q0.quest.kind).toBe("clear_all");
    expect(q0.quest.progress.achieved).toBe(false);
    expect(q0.totalXp).toBe(0);

    await handleFetch(req("/api/events/w1/action", "POST", { action: "rest" }), env);
    expect(await gameTotal(db)).toBe(0);
    await handleFetch(req("/api/events/w2/action", "POST", { action: "rest" }), env);
    expect(await gameTotal(db)).toBe(50);

    const g1 = (await (await handleFetch(req("/api/game", "GET"), env)).json()) as {
      totalXp: number;
      quest: { progress: { achieved: boolean }; bonusAwarded: boolean };
    };
    expect(g1.quest.progress.achieved).toBe(true);
    expect(g1.quest.bonusAwarded).toBe(true);
    await handleFetch(req("/api/events/w2/action", "POST", { action: "rest" }), env);
    expect(await gameTotal(db)).toBe(50);
    expect(await gameTotal(db)).toBe(50);
  });

  it("judges today in the pressing player's own timezone", async () => {
    // 15:00Z is already tomorrow in Tokyo (00:00+1) but still today in Berlin.
    expect(doneAllowedFor("2026-01-15T15:00:00.000Z", "hinata", new Date("2026-01-15T16:00:00.000Z"))).toBe(true);
    expect(doneAllowedFor("2026-01-15T15:00:00.000Z", "hinata", new Date("2026-01-15T14:00:00.000Z"))).toBe(false);
    expect(doneAllowedFor("2026-01-15T15:00:00.000Z", "simone", new Date("2026-01-15T16:00:00.000Z"))).toBe(true);
    expect(doneAllowedFor("2026-01-16T15:00:00.000Z", "simone", new Date("2026-01-15T16:00:00.000Z"))).toBe(false);
  });
});
