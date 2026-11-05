import { describe, expect, it } from "vitest";
import { handleFetch } from "../worker/src/index.js";
import type { Env } from "../worker/src/auth.js";

type Row = Record<string, unknown>;

function fakeDb(sessionRole: "hinata" | "simone" | null) {
  const queries: string[] = [];
  const direct = (sql: string) => ({
      first: async <T>(): Promise<T | null> => {
        queries.push(sql);
        if (sql.startsWith("SELECT id, role FROM sessions")) {
          if (!sessionRole) return null;
          return { id: "sess-1", role: sessionRole } as unknown as T;
        }
        return null;
      },
      all: async <T>(): Promise<{ results: T[] }> => {
        queries.push(sql);
        if (sql.includes("FROM weights")) {
          return { results: [{ id: "w1", recordedAtUtc: "2026-11-07T10:00:00.000Z", valueKg: 52.3 }] as unknown as T[] };
        }
        return { results: [] };
      },
      run: async () => {
        queries.push(sql);
        return {};
      },
    });
  const stmt = (sql: string) => ({
    ...direct(sql),
    bind: () => ({
      first: async <T>(): Promise<T | null> => {
        queries.push(sql);
        if (sql.startsWith("SELECT id, role FROM sessions")) {
          if (!sessionRole) return null;
          return { id: "sess-1", role: sessionRole } as unknown as T;
        }
        return null;
      },
      all: async <T>(): Promise<{ results: T[] }> => {
        queries.push(sql);
        if (sql.includes("FROM weights")) {
          return { results: [{ id: "w1", recordedAtUtc: "2026-11-07T10:00:00.000Z", valueKg: 52.3 }] as unknown as T[] };
        }
        return { results: [] };
      },
      run: async () => {
        queries.push(sql);
        return {};
      },
    }),
  });
  const db = { prepare: (sql: string) => stmt(sql), batch: async () => [] };
  return { db: db as unknown as D1Database, queries };
}

const baseEnv = { VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "" } as Env;

function authed(path: string, role: "hinata" | "simone" | null) {
  const { db, queries } = fakeDb(role);
  const req = new Request(`https://api.test${path}`, { headers: { cookie: "oc_session=sess-1" } });
  return { req, env: { ...baseEnv, DB: db }, queries };
}

describe("weight privacy", () => {
  it("hinata cannot read weight values (403, no values leak)", async () => {
    const { req, env } = authed("/api/weights", "hinata");
    const res = await handleFetch(req, env);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).not.toContain("52.3");
    expect(text).not.toContain("valueKg");
  });

  it("anonymous users cannot read weights", async () => {
    const { db } = fakeDb(null);
    const req = new Request("https://api.test/api/weights");
    const res = await handleFetch(req, { ...baseEnv, DB: db });
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("52.3");
  });

  it("hinata cannot write weights", async () => {
    const { req, env } = authed("/api/weights", "hinata");
    const post = new Request("https://api.test/api/weights", {
      method: "POST",
      headers: { cookie: "oc_session=sess-1", "content-type": "application/json" },
      body: JSON.stringify({ valueKg: 60 }),
    });
    void req;
    const res = await handleFetch(post, env);
    expect(res.status).toBe(403);
  });

  it("simone can read her own weights", async () => {
    const { req, env } = authed("/api/weights", "simone");
    const res = await handleFetch(req, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { weights: Row[] };
    expect(body.weights).toHaveLength(1);
    expect(body.weights[0]).toMatchObject({ valueKg: 52.3 });
  });
});
