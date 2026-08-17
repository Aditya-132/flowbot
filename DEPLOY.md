# Deploy FlowBot on Vercel

FlowBot is a single Express app that serves the marketing/SEO pages, the React
bot builder (`/app`), the REST API, and every provider's WhatsApp webhook. On
Vercel it runs as one serverless function (`api/index.js` → the Express app),
with the built frontend bundled in and a cron job driving broadcasts.

> **Why the extra pieces?** Vercel is serverless — there is no always-on process.
> The app's background broadcast worker is therefore triggered by a Vercel Cron
> hit to `/api/cron/broadcasts` instead of an in-process timer. Long "Delay"
> blocks (> ~60s) are the one feature that can't run reliably on serverless; if
> you rely on those, use a persistent host (`render.yaml` is still in the repo).

## 1. Push this folder to GitHub

Vercel deploys from a Git repo.

```bash
cd ~/Downloads/flowbot-meta/flowbot
git add .
git commit -m "Deploy FlowBot on Vercel"
git push
```

## 2. Add a Postgres database (Neon)

The app needs Postgres. Neon is a serverless Postgres that fits Vercel well.

1. In the Vercel dashboard open **Storage → Create Database → Neon** (Marketplace).
2. Connect it to the project. Vercel injects `DATABASE_URL` automatically.
3. Prefer Neon's **pooled** connection string (host contains `-pooler`) so many
   serverless instances don't exhaust connections. The code already enables SSL
   for any non-local database.

The database starts **empty** — you recreate/save your bot from the app UI after
the first deploy (step 5).

## 3. Import the project into Vercel

1. Open `https://vercel.com/new` and import the GitHub repo.
2. **Root Directory:** the folder containing `vercel.json` (this `flowbot` dir).
3. Framework preset: **Other** (leave build settings alone — `vercel.json` already
   defines the build, the function, routing, and the cron).
4. Click **Deploy**.

`vercel.json` does the rest:

- **Build:** installs backend + frontend deps and runs `vite build`.
- **Function:** `api/index.js` (the Express app), with `frontend/dist` bundled in
  and `maxDuration: 60`.
- **Routing:** every path is rewritten to the function, so Express serves the
  homepage, `/app`, `/api/*`, and all `/whapi`, `/meta`, `/green`, `/twilio`,
  `/whinta` webhooks exactly as it does locally.
- **Cron:** `GET /api/cron/broadcasts` every minute drains queued broadcasts and
  runs session/message cleanup.

## 4. Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Injected by the Neon integration (step 2). |
| `CRON_SECRET` | recommended | Any random string. Vercel sends it as `Authorization: Bearer <CRON_SECRET>` to the cron endpoint; the app rejects unauthenticated calls when it's set. |
| `GRAPH_API_BASE` | optional | Meta Cloud API base (defaults to `graph.facebook.com/v21.0`). |
| `GREEN_API_BASE` / `WHAPI_API_BASE` / `WHINTA_API_BASE` | optional | Provider base-URL overrides. |

`NODE_ENV=production` and `VERCEL=1` are set by the platform — don't add them
yourself. Per-bot provider credentials are stored in the database via the app UI,
not in env vars.

> **Cron cadence & plan:** the `*/1 * * * *` (every-minute) schedule in
> `vercel.json` needs a **Pro** plan. On **Hobby**, Vercel Cron runs at most once
> per day — change the schedule to e.g. `0 * * * *` (hourly) or trigger
> `/api/cron/broadcasts` from an external scheduler if you need faster broadcasts.

## 5. Recreate and activate your bot

The Neon database starts empty, so open your Vercel URL and:

1. Design or recreate the flow, then **Save** it.
2. Go to **Activate & test**, pick your provider (e.g. **Whapi.cloud**), paste the
   token, and **Activate**. You'll get a webhook path like `/whapi/webhook/<botId>`.

## 6. Point the provider webhook at your Vercel URL

In the provider's settings (Whapi.cloud shown), set the webhook to:

```text
https://<your-project>.vercel.app/whapi/webhook/<botId>
```

For Whapi: Event `messages.post`, Method `POST`, Mode `body`. Then message the
paired WhatsApp number from another phone to test.

---

### Local development (unchanged)

```bash
docker compose up -d                 # local Postgres on :5432
npm ci --prefix backend && npm ci --prefix frontend
npm run build --prefix frontend      # or run the frontend dev server separately
npm start                            # backend on :3001, serves the built app
```
