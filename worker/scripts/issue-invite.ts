export {};

import { buildInviteUrl, DEFAULT_APP_ORIGIN } from "../../shared/invite.js";

// Usage: SETUP_SECRET=... WORKER_URL=https://... [APP_ORIGIN=https://...] npm run invite -- --role simone
const role = process.argv.includes("--role") ? process.argv[process.argv.indexOf("--role") + 1] : "simone";
const workerUrl = process.env.WORKER_URL;
const setupSecret = process.env.SETUP_SECRET;
const appOrigin = process.env.APP_ORIGIN ?? DEFAULT_APP_ORIGIN;
if (!workerUrl || !setupSecret) {
  console.error("Set WORKER_URL and SETUP_SECRET env vars.");
  process.exit(1);
}
const res = await fetch(`${workerUrl}/api/invites`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-setup-secret": setupSecret },
  body: JSON.stringify({ role }),
});
const data = await res.json();
if (!res.ok) {
  console.error("Failed:", data);
  process.exit(1);
}
console.log(`Invite for ${role}: ${buildInviteUrl(appOrigin, (data as { token: string }).token)}`);
