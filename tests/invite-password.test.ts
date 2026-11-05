import { describe, expect, it } from "vitest";
import { handleFetch } from "../worker/src/index.js";
import { hashPassword, newPasswordSalt, sha256Hex, type Env } from "../worker/src/auth.js";

interface InviteRow {
  id: string;
  role: "hinata" | "simone";
  token: string;
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
  const stmt = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      first: async <T>(): Promise<T | null> => {
        if (sql.includes("FROM invites WHERE token_hash")) {
          const row = [...rows.values()].find((r) => r.token === String(args[0]));
          return (row ? { ...row } : null) as unknown as T;
        }
        if (sql.startsWith("SELECT id FROM invites WHERE role")) {
          const row = [...rows.values()].find((r) => r.role === String(args[0]) && !r.revoked);
          return (row ? { id: row.id } : null) as unknown as T;
        }
        return null;
      },
      all: async <T>(): Promise<{ results: T[] }> => ({ results: [] }),
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
    }),
  });
  // The worker looks rows up by token hash; precompute it the same way.
  const ready = Promise.all(
    [...rows.values()].map(async (r) => {
      r.token = await sha256Hex(r.token);
    }),
  );
  return { db: { prepare: stmt, batch: async () => [] } as unknown as D1Database, sessions, rows, ready };
}

const baseEnv = { VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "" } as Env;

const redeem = (token: string, password?: string) =>
  new Request("https://api.test/api/invite/redeem", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(password === undefined ? { token } : { token, password }),
  });

const setPassword = (secret: string, role: string, password: string) =>
  new Request("https://api.test/api/invites/password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-setup-secret": secret },
    body: JSON.stringify({ role, password }),
  });

async function rowWithPassword(role: "hinata" | "simone", token: string, password: string): Promise<InviteRow> {
  const password_salt = newPasswordSalt();
  return {
    id: `i-${role}`,
    role,
    token,
    used: false,
    revoked: false,
    password_hash: await hashPassword(password, password_salt),
    password_salt,
    failed_attempts: 0,
    locked_until: null,
  };
}

describe("password redeem", () => {
  it("logs in with the correct password without consuming the invite", async () => {
    const { db, sessions, ready } = fakeDb([await rowWithPassword("simone", "tok-fixed", "correct-horse-8")]);
    await ready;
    const env = { ...baseEnv, DB: db };
    for (let i = 0; i < 2; i++) {
      const res = await handleFetch(redeem("tok-fixed", "correct-horse-8"), env);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ role: "simone" });
      expect(res.headers.get("set-cookie")).toContain("oc_session=");
    }
    expect(sessions).toHaveLength(2);
  });

  it("rejects wrong passwords and revoked or unknown tokens", async () => {
    const { db, sessions, ready } = fakeDb([
      await rowWithPassword("hinata", "tok-h", "correct-horse-8"),
      { ...(await rowWithPassword("simone", "tok-rev", "correct-horse-8")), revoked: true },
    ]);
    await ready;
    const env = { ...baseEnv, DB: db };
    const wrong = await handleFetch(redeem("tok-h", "nope-nope-no"), env);
    expect(wrong.status).toBe(403);
    expect(await wrong.json()).toEqual({ error: "wrong_password" });
    const revoked = await handleFetch(redeem("tok-rev", "correct-horse-8"), env);
    expect(revoked.status).toBe(403);
    const unknown = await handleFetch(redeem("tok-nope", "correct-horse-8"), env);
    expect(unknown.status).toBe(403);
    expect(sessions).toHaveLength(0);
  });

  it("reports password_not_set when no password was registered", async () => {
    const row = await rowWithPassword("hinata", "tok-plain", "correct-horse-8");
    row.password_hash = null;
    row.password_salt = null;
    const { db, sessions, ready } = fakeDb([row]);
    await ready;
    const res = await handleFetch(redeem("tok-plain", "correct-horse-8"), { ...baseEnv, DB: db });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "password_not_set" });
    expect(sessions).toHaveLength(0);
  });

  it("locks for 15 minutes after 10 consecutive failures", async () => {
    const { db, sessions, rows, ready } = fakeDb([await rowWithPassword("simone", "tok-lock", "correct-horse-8")]);
    await ready;
    const env = { ...baseEnv, DB: db };
    for (let i = 0; i < 9; i++) {
      const res = await handleFetch(redeem("tok-lock", "wrong-wrong"), env);
      expect(res.status).toBe(403);
    }
    expect(rows.get("i-simone")?.failed_attempts).toBe(9);
    const tenth = await handleFetch(redeem("tok-lock", "wrong-wrong"), env);
    expect(tenth.status).toBe(403);
    const lockedUntil = rows.get("i-simone")?.locked_until;
    expect(lockedUntil).toBeTruthy();
    expect(Date.parse(lockedUntil!) - Date.now()).toBeGreaterThan(14 * 60 * 1000);
    // Even the correct password is refused while locked.
    const whileLocked = await handleFetch(redeem("tok-lock", "correct-horse-8"), env);
    expect(whileLocked.status).toBe(429);
    expect(await whileLocked.json()).toEqual({ error: "locked" });
    expect(sessions).toHaveLength(0);
  });

  it("accepts logins again after the lock expires", async () => {
    const row = await rowWithPassword("hinata", "tok-exp", "correct-horse-8");
    row.locked_until = new Date(Date.now() - 1000).toISOString();
    const { db, sessions, ready } = fakeDb([row]);
    await ready;
    const res = await handleFetch(redeem("tok-exp", "correct-horse-8"), { ...baseEnv, DB: db });
    expect(res.status).toBe(200);
    expect(sessions).toHaveLength(1);
  });
});

describe("password registration", () => {
  it("sets and overwrites the password with setup-secret guard", async () => {
    const { db, sessions, ready } = fakeDb([
      {
        id: "i-hinata",
        role: "hinata",
        token: "tok-h",
        used: true,
        revoked: false,
        password_hash: null,
        password_salt: null,
        failed_attempts: 0,
        locked_until: null,
      },
    ]);
    await ready;
    const env = { ...baseEnv, DB: db, SETUP_SECRET: "shh" };
    const set = await handleFetch(setPassword("shh", "hinata", "fresh-pass-9"), env);
    expect(set.status).toBe(200);
    const login = await handleFetch(redeem("tok-h", "fresh-pass-9"), env);
    expect(login.status).toBe(200);
    const overwrite = await handleFetch(setPassword("shh", "hinata", "newer-pass-10"), env);
    expect(overwrite.status).toBe(200);
    const stale = await handleFetch(redeem("tok-h", "fresh-pass-9"), env);
    expect(stale.status).toBe(403);
    const fresh = await handleFetch(redeem("tok-h", "newer-pass-10"), env);
    expect(fresh.status).toBe(200);
    expect(sessions).toHaveLength(2);
  });

  it("validates secret, length, and role rows", async () => {
    const { db, ready } = fakeDb([]);
    await ready;
    const env = { ...baseEnv, DB: db, SETUP_SECRET: "shh" };
    const badSecret = await handleFetch(setPassword("nope", "hinata", "long-enough-1"), env);
    expect(badSecret.status).toBe(403);
    const short = await handleFetch(setPassword("shh", "hinata", "short"), env);
    expect(short.status).toBe(400);
    const missing = await handleFetch(setPassword("shh", "simone", "long-enough-1"), env);
    expect(missing.status).toBe(404);
  });
});
