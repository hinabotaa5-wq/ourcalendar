import type { Role } from "../../shared/types.js";

export interface Env {
  DB: D1Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  SETUP_SECRET?: string;
  APP_ORIGIN?: string;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const PBKDF2_ITERATIONS = 100_000;

export function newPasswordSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  let bin = "";
  for (const b of salt) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function hashPassword(password: string, saltB64: string): Promise<string> {
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export async function verifyPassword(password: string, saltB64: string, expectedHash: string): Promise<boolean> {
  return timingSafeEqualHex(await hashPassword(password, saltB64), expectedHash);
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export function getSessionCookie(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)oc_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function sessionCookie(sessionId: string): string {
  const year = 60 * 60 * 24 * 365;
  return `oc_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${year}`;
}

export function clearSessionCookie(): string {
  return `oc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getSessionRole(req: Request, env: Env): Promise<{ id: string; role: Role } | null> {
  const sid = getSessionCookie(req);
  if (!sid) return null;
  const row = await env.DB.prepare(
    "SELECT id, role FROM sessions WHERE id = ? AND revoked = 0",
  )
    .bind(sid)
    .first<{ id: string; role: Role }>();
  return row;
}

export async function requireRole(req: Request, env: Env): Promise<{ id: string; role: Role } | Response> {
  const sess = await getSessionRole(req, env);
  if (!sess) return json({ error: "unauthorized" }, 401);
  return sess;
}

export function requireSimone(role: Role): Response | null {
  if (role !== "simone") return json({ error: "forbidden" }, 403);
  return null;
}
