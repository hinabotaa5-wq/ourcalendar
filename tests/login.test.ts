import { describe, expect, it } from "vitest";
import { handleFetch } from "../worker/src/index.js";
import { hashPassword, newPasswordSalt, type Env } from "../worker/src/auth.js";

interface InviteRow {
  id: string;
  role: "hinata" | "simone";
  used: boolean;
  revoked: boolean;
  password_hash: string | null;
  password_salt: string | null;
  failed_attempts: number;
  locked_until: string | null;
}

function fakeDb(initial: InviteRow[]) {
  const rows = new Map<string, InviteRow>(initial.map((r) => [r.id, { ...r }]));
  const sessions: { id: string; role: string }[] = [];
  const stmt = (sql: string) => {
    const bound = (...args: unknown[]) => ({
      first: async <T>(): Promise<T | null> => {
        if (sql.startsWith("SELECT id FROM invites WHERE role")) {
          const row = [...rows.values()].find((r) => r.role === String(args[0]) && !r.revoked);
          return (row ? { id: row.id } : null) as unknown as T;
        }
        return null;
      },
      all: async <T>(): Promise<{ results: T[] }> => {
        if (sql.includes("WHERE revoked = 0 AND password_hash IS NOT NULL")) {
          return {
            results: [...rows.values()].filter((r) => !r.revoked && r.password_hash != null).map((r) => ({ ...r })),
          } as unknown as { results: T[] };
        }
        if (sql.includes("WHERE role != ?")) {
          return {
            results: [...rows.values()]
              .filter((r) => r.role !== String(args[0]) && !r.revoked && r.password_hash != null)
              .map((r) => ({ password_hash: r.password_hash, password_salt: r.password_salt })),
          } as unknown as { results: T[] };
        }
        return { results: [] };
      },
      run: async () => {
        if (sql.startsWith("UPDATE invites SET failed_attempts = ? WHERE")) {
          const row = rows.get(String(args[1]));
          if (row) row.failed_attempts = Number(args[0]);
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE invites SET failed_attempts = 0, locked_until = ? WHERE")) {
          const row = rows.get(String(args[1]));
          if (row) {
            row.failed_attempts = 0;
            row.locked_until = String(args[0]);
          }
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE invites SET failed_attempts = 0, locked_until = NULL WHERE")) {
          const row = rows.get(String(args[0]));
          if (row) {
            row.failed_attempts = 0;
            row.locked_until = null;
          }
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE invites SET password_hash")) {
          const row = rows.get(String(args[2]));
          if (row) {
            row.password_hash = String(args[0]);
            row.password_salt = String(args[1]);
            row.failed_attempts = 0;
            row.locked_until = null;
          }
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("INSERT INTO sessions")) {
          sessions.push({ id: String(args[0]), role: String(args[1]) });
          return { meta: { changes: 1 } };
        }
        return { meta: { changes: 0 } };
      },
    });
    const unbound = bound();
    return { bind: bound, first: unbound.first, all: unbound.all, run: unbound.run };
  };
  return { db: { prepare: stmt, batch: async () => [] } as unknown as D1Database, sessions, rows };
}

const baseEnv = { VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "", SETUP_SECRET: "shh" } as Env;

const login = (password: string) =>
  new Request("https://api.test/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });

const setPassword = (role: string, password: string) =>
  new Request("https://api.test/api/invites/password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-setup-secret": "shh" },
    body: JSON.stringify({ role, password }),
  });

async function rowWithPassword(
  id: string,
  role: "hinata" | "simone",
  password: string | null,
): Promise<InviteRow> {
  if (password === null) {
    return { id, role, used: false, revoked: false, password_hash: null, password_salt: null, failed_attempts: 0, locked_until: null };
  }
  const password_salt = newPasswordSalt();
  return {
    id,
    role,
    used: false,
    revoked: false,
    password_hash: await hashPassword(password, password_salt),
    password_salt,
    failed_attempts: 0,
    locked_until: null,
  };
}

describe("single-URL login", () => {
  it("logs in as hinata or simone according to the password", async () => {
    const { db, sessions } = fakeDb([
      await rowWithPassword("i-h", "hinata", "hinata-pass-1"),
      await rowWithPassword("i-s", "simone", "simone-pass-2"),
    ]);
    const env = { ...baseEnv, DB: db };
    const h = await handleFetch(login("hinata-pass-1"), env);
    expect(h.status).toBe(200);
    expect(await h.json()).toEqual({ role: "hinata" });
    expect(h.headers.get("set-cookie")).toContain("oc_session=");
    const s = await handleFetch(login("simone-pass-2"), env);
    expect(s.status).toBe(200);
    expect(await s.json()).toEqual({ role: "simone" });
    expect(sessions).toHaveLength(2);
  });

  it("counts failures across rows and locks after 10", async () => {
    const { db, sessions, rows } = fakeDb([
      await rowWithPassword("i-h", "hinata", "hinata-pass-1"),
      await rowWithPassword("i-s", "simone", "simone-pass-2"),
    ]);
    const env = { ...baseEnv, DB: db };
    for (let i = 0; i < 2; i++) {
      expect((await handleFetch(login("nope-nope-no"), env)).status).toBe(403);
    }
    expect(rows.get("i-h")?.failed_attempts).toBe(2);
    expect(rows.get("i-s")?.failed_attempts).toBe(2);
    for (let i = 0; i < 8; i++) {
      expect((await handleFetch(login("nope-nope-no"), env)).status).toBe(403);
    }
    expect(rows.get("i-h")?.locked_until).toBeTruthy();
    expect(rows.get("i-s")?.locked_until).toBeTruthy();
    const locked = await handleFetch(login("hinata-pass-1"), env);
    expect(locked.status).toBe(429);
    expect(await locked.json()).toEqual({ error: "locked" });
    expect(sessions).toHaveLength(0);
  });

  it("resets counters on success", async () => {
    const { db, rows } = fakeDb([await rowWithPassword("i-h", "hinata", "hinata-pass-1")]);
    const env = { ...baseEnv, DB: db };
    await handleFetch(login("nope-nope-no"), env);
    expect(rows.get("i-h")?.failed_attempts).toBe(1);
    const ok = await handleFetch(login("hinata-pass-1"), env);
    expect(ok.status).toBe(200);
    expect(rows.get("i-h")?.failed_attempts).toBe(0);
  });

  it("reports password_not_set when no row has a password", async () => {
    const { db } = fakeDb([await rowWithPassword("i-h", "hinata", null)]);
    const res = await handleFetch(login("anything-at-all"), { ...baseEnv, DB: db });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "password_not_set" });
  });

  it("deterministically picks hinata for a legacy shared password", async () => {
    const { db, sessions } = fakeDb([
      await rowWithPassword("i-h", "hinata", "shared-legacy-9"),
      await rowWithPassword("i-s", "simone", "shared-legacy-9"),
    ]);
    const res = await handleFetch(login("shared-legacy-9"), { ...baseEnv, DB: db });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ role: "hinata" });
    expect(sessions).toHaveLength(1);
  });

  it("rejects registering a password that matches the other role", async () => {
    const { db } = fakeDb([
      await rowWithPassword("i-h", "hinata", null),
      await rowWithPassword("i-s", "simone", "simone-pass-2"),
    ]);
    const env = { ...baseEnv, DB: db };
    const conflict = await handleFetch(setPassword("hinata", "simone-pass-2"), env);
    expect(conflict.status).toBe(400);
    expect(await conflict.json()).toEqual({ error: "password_conflict" });
    const ok = await handleFetch(setPassword("hinata", "hinata-fresh-3"), env);
    expect(ok.status).toBe(200);
    const res = await handleFetch(login("hinata-fresh-3"), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ role: "hinata" });
  });
});
