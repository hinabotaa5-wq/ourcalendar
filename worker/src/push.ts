import type { Env } from "./auth.js";

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemToRawPrivateKey(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  return b64urlToBytes(b64.replace(/\+/g, "-").replace(/\//g, "_"));
}

export function ecdsaToRaw(sig: Uint8Array): Uint8Array {
  const raw = derToRaw(sig);
  if (raw) return raw;
  if (sig.length === 64) return sig.slice();
  throw new Error("unsupported ECDSA signature encoding");
}

function derToRaw(der: Uint8Array): Uint8Array | null {
  if (der.length < 8 || der[0] !== 0x30 || der[1] !== der.length - 2) return null;
  let o = 2;
  if (der[o] !== 0x02) return null;
  const rLen = der[o + 1];
  o += 2;
  const r = der.slice(o, o + rLen);
  o += rLen;
  if (der[o] !== 0x02) return null;
  const sLen = der[o + 1];
  o += 2;
  const s = der.slice(o, o + sLen);
  o += sLen;
  if (o !== der.length || r.length !== rLen || s.length !== sLen) return null;
  const raw = new Uint8Array(64);
  raw.set(r.slice(-32), 32 - Math.min(32, r.length));
  raw.set(s.slice(-32), 64 - Math.min(32, s.length));
  return raw;
}

export async function vapidAuthHeader(audience: string, subject: string, publicKey: string, privateKeyPem: string, expSec = 12 * 3600): Promise<string> {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + expSec, sub: subject })),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToRawPrivateKey(privateKeyPem).buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${header}.${body}`)),
  );
  // Node.js returns an ASN.1 DER signature here; spec-compliant runtimes
  // (browsers, Workers) return the raw 64-byte R||S form. Accept both.
  const rawSig = ecdsaToRaw(sig);
  void publicKey;
  return `${header}.${body}.${b64url(rawSig)}`;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPush(env: Env, target: PushTarget, payload: unknown): Promise<boolean> {
  try {
    const url = new URL(target.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await vapidAuthHeader(audience, env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    const res = await fetch(target.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
        "Content-Type": "application/json",
        TTL: "86400",
      },
      body: JSON.stringify(payload),
    });
    return res.ok || res.status === 201;
  } catch {
    return false;
  }
}
