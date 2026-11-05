import { describe, expect, it } from "vitest";
import type { Env } from "../worker/src/auth.js";
import { handleFetch } from "../worker/src/index.js";

function fakeDb(sessionRole: "hinata" | "simone" | null, users: Record<string, string>) {
  const writes: { role: string; language: string }[] = [];
  const stmt = (sql: string) => ({
    first: async <T>(): Promise<T | null> => {
      if (sql.startsWith("SELECT id, role FROM sessions")) {
        if (!sessionRole) return null;
        return { id: "sess-1", role: sessionRole } as unknown as T;
      }
      if (sql.includes("FROM users")) {
        const m = sql.match(/role = '(\w+)'/);
        const role = m ? m[1] : sessionRole;
        const w = writes.filter((x) => x.role === role).pop();
        const language = w?.language ?? users[role ?? ""];
        if (!language) return null;
        return { language } as unknown as T;
      }
      return null;
    },
    bind: (...args: unknown[]) => ({
      first: async <T>(): Promise<T | null> => {
        if (sql.startsWith("SELECT id, role FROM sessions")) {
          if (!sessionRole) return null;
          return { id: "sess-1", role: sessionRole } as unknown as T;
        }
        if (sql.includes("FROM users")) {
          const role = String(args[0]);
          const w = writes.filter((x) => x.role === role).pop();
          const language = w?.language ?? users[role];
          if (!language) return null;
          return { language } as unknown as T;
        }
        return null;
      },
      all: async <T>(): Promise<{ results: T[] }> => ({ results: [] }),
      run: async () => {
        if (sql.includes("INTO users")) writes.push({ role: String(args[0]), language: String(args[1]) });
        return {};
      },
    }),
  });
  return { db: { prepare: stmt, batch: async () => [] } as unknown as D1Database, writes };
}

const baseEnv = { VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "" } as Env;

function authed(path: string, role: "hinata" | "simone" | null, users: Record<string, string>, init?: RequestInit) {
  const { db, writes } = fakeDb(role, users);
  const req = new Request(`https://api.test${path}`, { headers: { cookie: "oc_session=sess-1" }, ...init });
  return { req, env: { ...baseEnv, DB: db }, writes };
}

describe("language settings", () => {
  it("returns the caller's own language, defaulting to en", async () => {
    const a = authed("/api/settings/language", "simone", {});
    expect(await (await handleFetch(a.req, a.env)).json()).toEqual({ language: "en" });
    const b = authed("/api/settings/language", "hinata", { hinata: "ja" });
    expect(await (await handleFetch(b.req, b.env)).json()).toEqual({ language: "ja" });
  });

  it("updates only the caller's own language and rejects bad values", async () => {
    const put = authed("/api/settings/language", "simone", {}, {
      method: "PUT",
      headers: { cookie: "oc_session=sess-1", "content-type": "application/json" },
      body: JSON.stringify({ language: "pl" }),
    });
    expect((await handleFetch(put.req, put.env)).status).toBe(200);
    expect(put.writes).toEqual([{ role: "simone", language: "pl" }]);

    const bad = authed("/api/settings/language", "simone", {}, {
      method: "PUT",
      headers: { cookie: "oc_session=sess-1", "content-type": "application/json" },
      body: JSON.stringify({ language: "de" }),
    });
    expect((await handleFetch(bad.req, bad.env)).status).toBe(400);

    const anon = authed("/api/settings/language", null, {}, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: "ja" }),
    });
    expect((await handleFetch(anon.req, anon.env)).status).toBe(401);
  });
});
