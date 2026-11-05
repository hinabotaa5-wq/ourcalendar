import { describe, expect, it } from "vitest";
import { handleFetch } from "../worker/src/index.js";
import { sha256Hex, type Env } from "../worker/src/auth.js";

interface Invite {
  id: string;
  role: "hinata" | "simone";
  token: string;
  used: boolean;
  revoked: boolean;
}

function fakeDb(invites: Invite[]) {
  const byHash = new Map<string, Invite>();
  const sessions: { id: string; role: string }[] = [];
  const ready = Promise.all(
    invites.map(async (inv) => {
      byHash.set(await sha256Hex(inv.token), inv);
    }),
  );
  const stmt = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      first: async <T>(): Promise<T | null> => {
        await ready;
        if (sql.includes("FROM invites WHERE token_hash")) {
          const inv = byHash.get(String(args[0]));
          if (!inv) return null;
          return { id: inv.id, role: inv.role, used: inv.used ? 1 : 0, revoked: inv.revoked ? 1 : 0 } as unknown as T;
        }
        return null;
      },
      all: async <T>(): Promise<{ results: T[] }> => ({ results: [] }),
      run: async () => {
        await ready;
        if (sql.startsWith("UPDATE invites SET used")) {
          const inv = [...byHash.values()].find((v) => v.id === String(args[1]));
          if (inv && !inv.used && !inv.revoked) {
            inv.used = true;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }
        if (sql.startsWith("INSERT INTO sessions")) {
          sessions.push({ id: String(args[0]), role: String(args[1]) });
          return { meta: { changes: 1 } };
        }
        return { meta: { changes: 0 } };
      },
    }),
  });
  const db = { prepare: stmt, batch: async () => [] } as unknown as D1Database;
  return { db, sessions, byHash, ready };
}

const baseEnv = { VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "" } as Env;

const redeem = (token: string) =>
  new Request("https://api.test/api/invite/redeem", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });

describe("invite redeem", () => {
  it("rejects missing and unknown tokens without creating sessions", async () => {
    const { db, sessions } = fakeDb([{ id: "i1", role: "hinata", token: "tok-once", used: false, revoked: false }]);
    const env = { ...baseEnv, DB: db };

    const missing = await handleFetch(
      new Request("https://api.test/api/invite/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      env,
    );
    expect(missing.status).toBe(400);

    const unknown = await handleFetch(redeem("tok-nope"), env);
    expect(unknown.status).toBe(403);
    expect(await unknown.json()).toEqual({ error: "invalid invite" });
    expect(sessions).toHaveLength(0);
  });

  it("rejects used, revoked, and unknown tokens without creating sessions", async () => {
    const { db, sessions } = fakeDb([
      { id: "i-used", role: "simone", token: "tok-used", used: true, revoked: false },
      { id: "i-rev", role: "simone", token: "tok-rev", used: false, revoked: true },
    ]);
    const env = { ...baseEnv, DB: db };
    for (const t of ["tok-used", "tok-rev", "tok-nope"]) {
      const res = await handleFetch(redeem(t), env);
      expect(res.status).toBe(403);
    }
    expect(sessions).toHaveLength(0);
  });
});
