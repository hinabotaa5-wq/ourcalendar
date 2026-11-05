export {};
// Usage: SETUP_SECRET=... WORKER_URL=https://... npm run invite -- --role simone
const role = process.argv.includes("--role") ? process.argv[process.argv.indexOf("--role") + 1] : "simone";
const workerUrl = process.env.WORKER_URL;
const setupSecret = process.env.SETUP_SECRET;
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
console.log(`Invite for ${role}: ${workerUrl}/invite/${(data as { token: string }).token}`);
