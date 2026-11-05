export {};

// Usage: WORKER_URL=https://... SETUP_SECRET=... npm run set-password -- --role simone
// Reads the password from a hidden terminal prompt (no echo). The password
// never appears in arguments, environment variables, logs, or output.
import { stdin as input, stdout as output } from "node:process";

const role = process.argv.includes("--role") ? process.argv[process.argv.indexOf("--role") + 1] : "simone";
const workerUrl = process.env.WORKER_URL;
const setupSecret = process.env.SETUP_SECRET;
const appOriginNote = "https://ourcalendar-1ze.pages.dev";
if (!workerUrl || !setupSecret) {
  console.error("Set WORKER_URL and SETUP_SECRET env vars.");
  process.exit(1);
}
if (role !== "hinata" && role !== "simone") {
  console.error("Role must be hinata or simone.");
  process.exit(1);
}

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!input.isTTY) {
      reject(new Error("A terminal is required so the password is never echoed."));
      return;
    }
    output.write(prompt);
    let buf = "";
    const onData = (chunk: Buffer) => {
      for (const byte of chunk) {
        if (byte === 0x03) {
          cleanup();
          output.write("\n");
          reject(new Error("Cancelled."));
          return;
        }
        if (byte === 0x0d || byte === 0x0a) {
          cleanup();
          output.write("\n");
          resolve(buf);
          return;
        }
        if (byte === 0x7f || byte === 0x08) {
          buf = buf.slice(0, -1);
          continue;
        }
        buf += String.fromCharCode(byte);
      }
    };
    const cleanup = () => {
      input.off("data", onData);
      if (input.isTTY) input.setRawMode(false);
      input.pause();
    };
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

const first = await readHidden(`New password for ${role} (min 8 chars, hidden): `);
if (first.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}
const second = await readHidden("Repeat the password to confirm: ");
if (first !== second) {
  console.error("Passwords do not match.");
  process.exit(1);
}

const res = await fetch(`${workerUrl}/api/invites/password`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-setup-secret": setupSecret },
  body: JSON.stringify({ role, password: first }),
});
const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error("Failed:", data);
  process.exit(1);
}
console.log(`Password set for role: ${role} (login URL stays ${appOriginNote}/invite/<token>)`);
