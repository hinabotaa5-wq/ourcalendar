# ourcalendar

ourcalendar is a shared schedule app for two people (Hinata + Simone), starting with home workouts + weekly jogging. English UI. Times are stored as UTC and shown in both time zones — **"Simone's time"** (never "Berlin") and **"Hinata's time"**.

Stack: TypeScript throughout. React + Vite PWA (`web/`), Cloudflare Workers + Cron (`worker/`), Cloudflare D1 (`worker/migrations/`). No TrackTalk infra is used.

## Setup

Requires Node 20+.

```sh
npm install
npm run dev        # frontend dev server (proxies /api to :8787)
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # typecheck + production build
```

To run the API locally you need Wrangler with a local D1:

```sh
npx wrangler d1 create ourcalendar
# put the returned database_id into worker/wrangler.toml
npx wrangler d1 migrations apply ourcalendar --local
npx wrangler dev
```

## Environment variables / secrets (names only)

Set via `wrangler secret put <NAME>` (values never go in the repo):

- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — Web Push sender identity
- `SETUP_SECRET` — guards one-time invite issuance (`POST /api/invites`)

Non-secret var: `APP_ORIGIN` (see `worker/wrangler.toml`).

Frontend needs no secrets. The VAPID public key is served to the app via `GET /api/push/vapid-key`.

## Deploy overview (not done yet)

1. `npx wrangler d1 create ourcalendar` (production) → set `database_id`
2. `npx wrangler d1 migrations apply ourcalendar`
3. `wrangler secret put` for each secret above
4. `npx wrangler deploy` (API + cron)
5. Deploy `web/` to Cloudflare Pages (build: `npm run build`, output `web/dist`)

Cron (`15 * * * *`, hourly) sends the 15:00 Simone-time workout reminder and the Saturday 19:00 weight check-in reminder. No real push is sent from tests (mocked).

## Issuing invite links

One single-use invite per person. With the Worker running:

```sh
WORKER_URL=https://<your-worker> SETUP_SECRET=<name-only-ref> npm run invite -- --role simone
WORKER_URL=https://<your-worker> SETUP_SECRET=<name-only-ref> npm run invite -- --role hinata
```

Each command prints a one-time `/invite/<token>` URL. Opening it on a phone binds a long-lived session to that device. Sessions (either device) can be revoked from Settings → Sessions, which signs the other device out.

## Notes

- Time zones: `Asia/Tokyo` (Hinata), `Europe/Berlin` (Simone's Germany zone). Labels always use names.
- Weight data is Simone-only: the API returns 403 for Hinata (covered by `tests/weight-privacy.test.ts`).
