import { describe, expect, it } from "vitest";
import { ecdsaToRaw, vapidAuthHeader } from "../worker/src/push.js";

function b64urlToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function toPem(pkcs8: ArrayBuffer): string {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
  const lines = b64.match(/.{1,64}/g)!.join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----\n`;
}

/** This runtime (like Workers) uses raw R||S ECDSA signatures. */

describe("vapidAuthHeader", () => {
  it("produces a JWT whose signature matches the signed header.body", async () => {
    const keypair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const pem = toPem(await crypto.subtle.exportKey("pkcs8", keypair.privateKey));
    const jwt = await vapidAuthHeader("https://push.example.com", "https://ourcalendar.pages.dev", "unused", pem);
    const [h, b, s] = jwt.split(".");
    expect(JSON.parse(new TextDecoder().decode(b64urlToBytes(h)))).toEqual({ typ: "JWT", alg: "ES256" });
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(b)));
    expect(payload.aud).toBe("https://push.example.com");
    const raw = b64urlToBytes(s);
    expect(raw).toHaveLength(64);
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      keypair.publicKey,
      raw.buffer as ArrayBuffer,
      new TextEncoder().encode(`${h}.${b}`),
    );
    expect(ok).toBe(true);
  });

  it("passes already-raw 64-byte signatures through", () => {
    const raw = Uint8Array.from({ length: 64 }, (_, i) => i);
    expect(ecdsaToRaw(raw)).toEqual(raw);
  });
});
