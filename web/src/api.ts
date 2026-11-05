import type { GameView } from "../../shared/game.js";
import type { CalEvent, Lang, Role, WeightEntry } from "../../shared/types.js";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  me: () => req<{ role: Role | null }>("/api/me"),
  redeemInvite: (token: string, password: string) =>
    req<{ role: Role }>("/api/invite/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    }),
  revokeSession: (id?: string) =>
    req<{ ok: boolean }>("/api/session", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }),
  events: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const s = q.toString();
    return req<{ events: CalEvent[] }>(`/api/events${s ? `?${s}` : ""}`);
  },
  createEvent: (e: Partial<CalEvent>) =>
    req<{ id: string }>("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(e),
    }),
  updateEvent: (id: string, e: Partial<CalEvent>) =>
    req<{ ok: boolean }>(`/api/events/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(e),
    }),
  deleteEvent: (id: string) => req<{ ok: boolean }>(`/api/events/${id}`, { method: "DELETE" }),
  eventAction: (id: string, action: "done" | "rest" | "move", movedToUtc?: string) =>
    req<{ ok: boolean; status: string }>(`/api/events/${id}/action`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, movedToUtc }),
    }),
  weights: () => req<{ weights: WeightEntry[] }>("/api/weights"),
  addWeight: (valueKg: number, recordedAtUtc?: string) =>
    req<{ ok: boolean }>("/api/weights", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ valueKg, recordedAtUtc }),
    }),
  vapidKey: () => req<{ publicKey: string }>("/api/push/vapid-key"),
  subscribePush: (sub: PushSubscriptionJSON) =>
    req<{ ok: boolean }>("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys }),
    }),
  testPush: () => req<{ ok: boolean; sent: number; targets: number }>("/api/push/test", { method: "POST" }),
  game: () => req<GameView>("/api/game"),
  language: () => req<{ language: Lang }>("/api/settings/language"),
  setLanguage: (language: Lang) =>
    req<{ ok: boolean }>("/api/settings/language", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language }),
    }),
};

export function urlBase64ToU8(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
