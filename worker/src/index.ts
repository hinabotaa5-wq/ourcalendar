import { isSimoneReminderMinute, isSimoneWeightMinute } from "../../shared/time.js";
import type { CalEvent, EventCategory, EventStatus, Lang, Role } from "../../shared/types.js";
import { isLang } from "../../shared/types.js";
import { pushText } from "../../shared/push-texts.js";
import {
  clearSessionCookie,
  getSessionRole,
  hashPassword,
  json,
  newId,
  newPasswordSalt,
  nowIso,
  requireRole,
  requireSimone,
  sessionCookie,
  sha256Hex,
  verifyPassword,
  type Env,
} from "./auth.js";
import { sendPush } from "./push.js";
import { getLanguage, runDailyReminder, runWeightReminder } from "./reminders.js";
import { addXp, doneAllowedFor, syncQuest, xpForDone } from "./game.js";

function validCategory(c: unknown): c is EventCategory {
  return c === "Workout" || c === "Jogging" || c === "General";
}

export async function handleFetch(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/api/health") return json({ ok: true });

  if (path === "/api/me") {
    const sess = await getSessionRole(req, env);
    if (!sess) return json({ role: null });
    return json({ role: sess.role });
  }

  if (path === "/api/invite/redeem" && req.method === "POST") {
    const { token, password } = (await req.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
    };
    if (!token) return json({ error: "missing token" }, 400);
    const hash = await sha256Hex(token);
    const inv = await env.DB.prepare(
      "SELECT id, role, revoked, password_hash, password_salt, failed_attempts, locked_until FROM invites WHERE token_hash = ?",
    )
      .bind(hash)
      .first<{
        id: string;
        role: Role;
        revoked: number;
        password_hash: string | null;
        password_salt: string | null;
        failed_attempts: number;
        locked_until: string | null;
      }>();
    if (!inv || inv.revoked) return json({ error: "invalid invite" }, 403);
    if (inv.password_hash == null || inv.password_salt == null)
      return json({ error: "password_not_set" }, 403);
    if (inv.locked_until && Date.parse(inv.locked_until) > Date.now())
      return json({ error: "locked" }, 429);
    // The fixed URL stays usable: a correct password logs in without consuming the invite.
    if (typeof password !== "string" || !(await verifyPassword(password, inv.password_salt, inv.password_hash))) {
      const fails = (inv.failed_attempts ?? 0) + 1;
      if (fails >= 10) {
        const until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await env.DB.prepare("UPDATE invites SET failed_attempts = 0, locked_until = ? WHERE id = ?")
          .bind(until, inv.id)
          .run();
      } else {
        await env.DB.prepare("UPDATE invites SET failed_attempts = ? WHERE id = ?")
          .bind(fails, inv.id)
          .run();
      }
      return json({ error: "wrong_password" }, 403);
    }
    await env.DB.prepare("UPDATE invites SET failed_attempts = 0, locked_until = NULL WHERE id = ?")
      .bind(inv.id)
      .run();
    const sid = newId();
    await env.DB.prepare(
      "INSERT INTO sessions (id, role, created_at, last_seen_at, revoked) VALUES (?, ?, ?, ?, 0)",
    )
      .bind(sid, inv.role, nowIso(), nowIso())
      .run();
    return json({ role: inv.role }, 200, { "set-cookie": sessionCookie(sid) });
  }

  if (path === "/api/invites/password" && req.method === "POST") {
    if (!env.SETUP_SECRET) return json({ error: "setup disabled" }, 403);
    if (req.headers.get("x-setup-secret") !== env.SETUP_SECRET) return json({ error: "forbidden" }, 403);
    const { role, password } = (await req.json().catch(() => ({}))) as {
      role?: Role;
      password?: string;
    };
    if (role !== "hinata" && role !== "simone") return json({ error: "bad role" }, 400);
    if (typeof password !== "string" || password.length < 8)
      return json({ error: "password_too_short" }, 400);
    const row = await env.DB.prepare("SELECT id FROM invites WHERE role = ? AND revoked = 0")
      .bind(role)
      .first<{ id: string }>();
    if (!row) return json({ error: "no invite for role" }, 404);
    const salt = newPasswordSalt();
    const passwordHash = await hashPassword(password, salt);
    await env.DB.prepare(
      "UPDATE invites SET password_hash = ?, password_salt = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?",
    )
      .bind(passwordHash, salt, row.id)
      .run();
    return json({ ok: true });
  }

  if (path === "/api/invites" && req.method === "POST") {
    if (!env.SETUP_SECRET) return json({ error: "setup disabled" }, 403);
    if (req.headers.get("x-setup-secret") !== env.SETUP_SECRET) return json({ error: "forbidden" }, 403);
    const { role } = (await req.json().catch(() => ({}))) as { role?: Role };
    if (role !== "hinata" && role !== "simone") return json({ error: "bad role" }, 400);
    const existing = await env.DB.prepare("SELECT id FROM invites WHERE role = ? AND revoked = 0")
      .bind(role)
      .first();
    if (existing) return json({ error: "invite already exists for role" }, 409);
    const token = crypto.randomUUID() + "-" + crypto.randomUUID().replace(/-/g, "");
    const hash = await sha256Hex(token);
    await env.DB.prepare(
      "INSERT INTO invites (id, role, token_hash, used, revoked, created_at) VALUES (?, ?, ?, 0, 0, ?)",
    )
      .bind(newId(), role, hash, nowIso())
      .run();
    return json({ role, token });
  }

  if (path === "/api/sessions" && req.method === "GET") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const rows = await env.DB.prepare("SELECT id, role, created_at AS createdAt, last_seen_at AS lastSeenAt FROM sessions WHERE revoked = 0")
      .all();
    return json({ sessions: rows.results ?? [] });
  }

  if (path === "/api/session" && req.method === "DELETE") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const { id } = (await req.json().catch(() => ({}))) as { id?: string };
    if (id) {
      await env.DB.prepare("UPDATE sessions SET revoked = 1 WHERE id = ?").bind(id).run();
    } else {
      await env.DB.prepare("UPDATE sessions SET revoked = 1 WHERE id = ?").bind(me.id).run();
    }
    const res = json({ ok: true });
    if (!id || id === me.id) res.headers.set("set-cookie", clearSessionCookie());
    return res;
  }

  if (path === "/api/events" && req.method === "GET") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    let q = "SELECT id, title, category, starts_at_utc AS startsAtUtc, duration_min AS durationMin, notes, video_url AS videoUrl, status, moved_to_utc AS movedToUtc, created_by AS createdBy, updated_at_utc AS updatedAtUtc FROM events";
    const conds: string[] = [];
    const args: unknown[] = [];
    if (from) {
      conds.push("starts_at_utc >= ?");
      args.push(from);
    }
    if (to) {
      conds.push("starts_at_utc < ?");
      args.push(to);
    }
    if (conds.length) q += " WHERE " + conds.join(" AND ");
    q += " ORDER BY starts_at_utc ASC LIMIT 500";
    const rows = await env.DB.prepare(q)
      .bind(...args)
      .all<CalEvent>();
    return json({ events: rows.results ?? [] });
  }

  if (path === "/api/events" && req.method === "POST") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const body = (await req.json().catch(() => ({}))) as Partial<CalEvent>;
    if (!body.title || !body.startsAtUtc || !validCategory(body.category)) {
      return json({ error: "title, startsAtUtc and valid category required" }, 400);
    }
    const id = newId();
    await env.DB.prepare(
      `INSERT INTO events (id, title, category, starts_at_utc, duration_min, notes, video_url, status, moved_to_utc, created_by, updated_at_utc)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', NULL, ?, ?)`,
    )
      .bind(
        id,
        body.title,
        body.category,
        body.startsAtUtc,
        body.durationMin ?? 45,
        body.notes ?? "",
        body.videoUrl ?? "",
        me.role,
        nowIso(),
      )
      .run();
    return json({ id }, 201);
  }

  const eventMatch = path.match(/^\/api\/events\/([^/]+)(\/action)?$/);
  if (eventMatch) {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const id = eventMatch[1];
    if (req.method === "PUT" && !eventMatch[2]) {
      const body = (await req.json().catch(() => ({}))) as Partial<CalEvent>;
      if (body.category && !validCategory(body.category)) return json({ error: "bad category" }, 400);
      await env.DB.prepare(
        `UPDATE events SET title = COALESCE(?, title), category = COALESCE(?, category),
         starts_at_utc = COALESCE(?, starts_at_utc), duration_min = COALESCE(?, duration_min),
         notes = COALESCE(?, notes), video_url = COALESCE(?, video_url), updated_at_utc = ? WHERE id = ?`,
      )
        .bind(
          body.title ?? null,
          body.category ?? null,
          body.startsAtUtc ?? null,
          body.durationMin ?? null,
          body.notes ?? null,
          body.videoUrl ?? null,
          nowIso(),
          id,
        )
        .run();
      return json({ ok: true });
    }
    if (req.method === "DELETE" && !eventMatch[2]) {
      await env.DB.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
      await syncQuest(env, new Date());
      return json({ ok: true });
    }
    if (req.method === "POST" && eventMatch[2]) {
      const { action, movedToUtc } = (await req.json().catch(() => ({}))) as {
        action?: string;
        movedToUtc?: string;
      };
      let status: EventStatus | null = null;
      if (action === "done") status = "done";
      else if (action === "rest" || action === "rest-today") status = "rested";
      else if (action === "move") status = "moved";
      if (!status) return json({ error: "unknown action" }, 400);
      if (status === "moved" && !movedToUtc) return json({ error: "movedToUtc required" }, 400);
      const target = await env.DB.prepare("SELECT category, starts_at_utc AS startsAtUtc FROM events WHERE id = ?")
        .bind(id)
        .first<{ category: string; startsAtUtc: string }>();
      if (!target) return json({ error: "not found" }, 404);
      if (status === "done" && !doneAllowedFor(target.startsAtUtc, me.role, new Date())) {
        return json({ error: "done only allowed for today's events" }, 400);
      }
      await env.DB.prepare("UPDATE events SET status = ?, moved_to_utc = ?, updated_at_utc = ? WHERE id = ?")
        .bind(status, movedToUtc ?? null, nowIso(), id)
        .run();
      if (status === "moved" && movedToUtc) {
        const orig = await env.DB.prepare("SELECT title, category, duration_min AS durationMin, notes, video_url AS videoUrl FROM events WHERE id = ?")
          .bind(id)
          .first<{ title: string; category: EventCategory; durationMin: number; notes: string; videoUrl: string }>();
        if (orig) {
          await env.DB.prepare(
            `INSERT INTO events (id, title, category, starts_at_utc, duration_min, notes, video_url, status, moved_to_utc, created_by, updated_at_utc)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', NULL, ?, ?)`,
          )
            .bind(newId(), orig.title, orig.category, movedToUtc, orig.durationMin, orig.notes, orig.videoUrl, me.role, nowIso())
            .run();
        }
      }
      if (status === "done") {
        await addXp(env, `done:${id}`, xpForDone(target.category));
      }
      const game = await syncQuest(env, new Date());
      return json({ ok: true, status, game });
    }
  }

  if (path === "/api/game" && req.method === "GET") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    return json(await syncQuest(env, new Date()));
  }

  if (path === "/api/weights" && req.method === "GET") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const denied = requireSimone(me.role);
    if (denied) return denied;
    const rows = await env.DB.prepare(
      "SELECT id, recorded_at_utc AS recordedAtUtc, value_kg AS valueKg FROM weights ORDER BY recorded_at_utc DESC LIMIT 100",
    ).all();
    return json({ weights: rows.results ?? [] });
  }

  if (path === "/api/weights" && req.method === "POST") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const denied = requireSimone(me.role);
    if (denied) return denied;
    const { valueKg, recordedAtUtc } = (await req.json().catch(() => ({}))) as {
      valueKg?: number;
      recordedAtUtc?: string;
    };
    if (typeof valueKg !== "number" || !(valueKg > 0) || valueKg > 500) {
      return json({ error: "invalid valueKg" }, 400);
    }
    await env.DB.prepare("INSERT INTO weights (id, recorded_at_utc, value_kg, created_by) VALUES (?, ?, ?, ?)")
      .bind(newId(), recordedAtUtc ?? nowIso(), valueKg, me.role)
      .run();
    return json({ ok: true }, 201);
  }

  if (path === "/api/push/subscribe" && req.method === "POST") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const sub = (await req.json().catch(() => ({}))) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return json({ error: "bad subscription" }, 400);
    await env.DB.prepare(
      `INSERT INTO push_subscriptions (id, role, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET role = excluded.role, p256dh = excluded.p256dh, auth = excluded.auth`,
    )
      .bind(newId(), me.role, sub.endpoint, sub.keys.p256dh, sub.keys.auth, nowIso())
      .run();
    return json({ ok: true });
  }

  if (path === "/api/push/test" && req.method === "POST") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const rows = await env.DB.prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE role = ?")
      .bind(me.role)
      .all<{ endpoint: string; p256dh: string; auth: string }>();
    const targets = rows.results ?? [];
    const lang = await getLanguage(env, me.role);
    const payload = { ...pushText(lang, "test"), url: "/" };
    let sent = 0;
    for (const t of targets) {
      if (await sendPush(env, t, payload)) sent++;
    }
    return json({ ok: true, sent, targets: targets.length });
  }

  if (path === "/api/settings/language" && req.method === "GET") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    return json({ language: await getLanguage(env, me.role) });
  }

  if (path === "/api/settings/language" && req.method === "PUT") {
    const me = await requireRole(req, env);
    if (me instanceof Response) return me;
    const { language } = (await req.json().catch(() => ({}))) as { language?: unknown };
    if (!isLang(language)) return json({ error: "bad language" }, 400);
    const lang: Lang = language;
    await env.DB.prepare(
      "INSERT INTO users (role, language) VALUES (?, ?) ON CONFLICT(role) DO UPDATE SET language = excluded.language",
    )
      .bind(me.role, lang)
      .run();
    return json({ ok: true });
  }

  if (path === "/api/push/vapid-key") {
    return json({ publicKey: env.VAPID_PUBLIC_KEY ?? "" });
  }

  return json({ error: "not found" }, 404);
}

export async function handleScheduled(env: Env, nowUtc = new Date()): Promise<void> {
  if (isSimoneReminderMinute(nowUtc)) await runDailyReminder(env, nowUtc);
  if (isSimoneWeightMinute(nowUtc)) await runWeightReminder(env);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return handleFetch(req, env);
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env, new Date()));
  },
};
