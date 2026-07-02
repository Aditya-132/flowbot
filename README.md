# ⚡ FlowBot — Flowchart → WhatsApp Bot Builder (Full-Stack Prototype)

Design a flowchart in the browser, and FlowBot turns it into a working WhatsApp bot —
**deterministically, from pre-embedded code templates. No AI anywhere in the bot runtime.**

```
┌──────────────┐   REST API    ┌──────────────────┐  webhooks  ┌──────────────────┐
│ React builder│ ────────────▶ │ Express backend   │ ◀────────▶ │ Meta / QR APIs   │──▶ WhatsApp
│ (Vite, :5173)│  save/simulate│  engine (:3001)   │            │ / Twilio         │
└──────────────┘               └────────┬─────────┘            └──────────────────┘
                                        │ pg
                                 ┌──────▼───────┐
                                 │  PostgreSQL  │  flows, creds, active state
                                 └──────────────┘
```

## The 5 pre-embedded features

| Block | What it does |
|---|---|
| 👋 Welcome Message | Entry point — greets on the first message |
| 🔢 Menu Options | Numbered menu; each option branches to another block |
| 💬 FAQ Auto-Reply | Keyword → answer table (type `0` to continue the flow) |
| 📝 Collect Info | Asks a question, saves the reply as `{variable}` |
| 🤝 Goodbye / Handoff | Ends the chat; supports `{variables}` like `{name}` |

Each block maps to a fixed handler in `backend/engine.js`. Generating a bot is just:
**your flowchart serialized as JSON + those handlers = server.js**. String assembly, zero AI.

## Run it

**1. Start PostgreSQL** (pick one):

```bash
# easiest — Docker:
docker compose up -d

# or use an existing Postgres and create the db:
#   CREATE USER flowbot WITH PASSWORD 'flowbot';
#   CREATE DATABASE flowbot OWNER flowbot;
```

Default connection is `postgres://flowbot:flowbot@localhost:5432/flowbot`;
override with the `DATABASE_URL` env var (see `backend/.env.example`).
The `flows` table is auto-created on first startup.

**2. Backend + frontend:**

```bash
# terminal 1 — backend (port 3001)
cd backend
npm install
npm start

# terminal 2 — frontend (port 5173, proxies /api → 3001)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Use it

1. **Design flow** — add blocks from the palette, drag to arrange, wire them:
   click a block's **right dot**, then another block's **left dot**. Click a wire to delete it.
   Click a block to edit its texts in the right panel. Hit **💾 Save**.
2. **Bot code** — see the standalone `server.js` generated for your flow.
   Copy or download it; it runs anywhere with just `npm install express`.
3. **Activate & test** — pick Meta Cloud API, Green API, Whapi.cloud, or Twilio, paste the
   provider credentials, and hit **🚀 Activate**.
   Then chat with your bot in the phone simulator — it runs through the *same backend
   engine* that serves the real webhook.

## Go live on real WhatsApp

Four providers are supported — pick one in the Activate tab.

### Option A: Meta WhatsApp Cloud API (recommended — free, no credit card)

Meta auto-creates a **free test business number** when you set up Cloud API,
with relaxed limits and no payment method required.

1. Go to [developers.facebook.com](https://developers.facebook.com) → create a **Business** app → add the **WhatsApp** product.
2. In **WhatsApp → API Setup**, copy the **temporary Access Token** and the
   **Phone Number ID** of the test number, and add your personal WhatsApp
   number as a recipient (up to 5 allowed).
3. In FlowBot's Activate tab, choose **Meta Cloud API**, paste both values, hit Activate.
   You get a **Callback URL** and a **Verify token**.
4. Expose the backend over https: `ngrok http 3001`.
5. In your Meta app → **WhatsApp → Configuration → Webhook**: paste
   `https://<ngrok-url>/meta/webhook/<botId>` + the verify token, click
   **Verify and save**, then subscribe to the **messages** field.
6. Message the test number from your WhatsApp. Your flowchart answers. 🎉

Notes: the temporary token expires in ~24h (create a System User token for
anything longer), and the free tier includes 1,000 service conversations/month.

### Option B: Green API (QR-paired hosted unofficial API)

Green API gives you a hosted REST API + webhook after you pair your own WhatsApp
number by QR. It has a free developer tier, but because it is not the official
Meta Cloud API, keep the same WhatsApp ban-risk caveat in mind.

1. Create a Green API account and developer instance in `console.green-api.com`.
2. Copy **ID Instance** and **API Token Instance**.
3. Scan the QR from Green API using WhatsApp → Linked devices.
4. In FlowBot's Activate tab, choose **Green API**, paste both values, hit Activate.
5. Expose the backend: `ngrok http 3001`.
6. In Green API instance settings, enable incoming webhooks and set
   `https://<ngrok-url>/green/webhook/<botId>` as the webhook URL.
7. Message the paired WhatsApp number. Your flowchart answers.

### Option C: Whapi.cloud (free sandbox, QR pairing)

Whapi.cloud gives you a free sandbox/channel for testing, QR pairing, REST send,
and webhooks. Like other linked-device APIs, keep WhatsApp account safety in mind.

1. Create a Whapi.cloud account and channel in `panel.whapi.cloud`.
2. Pair your WhatsApp number by QR and copy the channel **API token**.
3. In FlowBot's Activate tab, choose **Whapi.cloud**, paste the token, hit Activate.
4. Expose the backend: `ngrok http 3001`.
5. In Whapi.cloud channel settings → Webhooks, add
   `https://<ngrok-url>/whapi/webhook/<botId>` for `messages.post`.
6. Message the paired WhatsApp number. Your flowchart answers.

### Option D: Twilio Sandbox

1. Expose the backend: `ngrok http 3001`
2. In Twilio Console → Messaging → WhatsApp Sandbox, set
   **"When a message comes in"** to `https://<ngrok-url>/whatsapp/<botId>` (POST).
3. Message your sandbox number on WhatsApp.

Alternatively, download the generated `server.js` (tab 2) and host that single file
anywhere — it embeds your whole flow and needs only Express.

## API reference (backend)

| Method & path | Purpose |
|---|---|
| `GET  /api/flows` | List saved bots |
| `POST /api/flows` | Create a bot `{name, nodes, edges}` |
| `GET  /api/flows/:id` | Get a bot (auth token never returned) |
| `PUT  /api/flows/:id` | Update a bot |
| `DELETE /api/flows/:id` | Delete a bot |
| `POST /api/flows/:id/activate` | Go live. Twilio: `{sid, token, number}` · Meta: `{provider:"meta", accessToken, phoneNumberId}` (returns `verifyToken`) · Green: `{provider:"green", idInstance, apiTokenInstance, apiUrl?}` · Whapi: `{provider:"whapi", token, apiUrl?}` |
| `POST /api/flows/:id/simulate` | Run a message through the engine `{from, message, reset?}` |
| `GET  /api/flows/:id/code` | Export standalone `server.js` |
| `POST /whatsapp/:id` | **Live Twilio webhook** (urlencoded → TwiML) |
| `GET  /meta/webhook/:id` | **Meta webhook verification** (hub.challenge handshake) |
| `POST /meta/webhook/:id` | **Live Meta webhook** (JSON in → replies sent via Graph API) |
| `POST /green/webhook/:id` | **Live Green API webhook** (JSON in → replies sent via Green API REST) |
| `POST /whapi/webhook/:id` | **Live Whapi.cloud webhook** (JSON in → replies sent via Whapi REST) |

## Project layout

```
flowbot/
├── backend/
│   ├── server.js    # REST API + live provider webhooks
│   ├── engine.js    # deterministic flow interpreter (the 5 feature handlers)
│   ├── meta.js      # Meta Cloud API adapter (webhook parsing + Graph API sends)
│   ├── green.js     # Green API adapter (webhook parsing + REST sends)
│   ├── whapi.js     # Whapi.cloud adapter (webhook parsing + REST sends)
│   ├── codegen.js   # standalone server.js exporter (template assembly)
│   ├── store.js     # PostgreSQL persistence (pg, auto-creates flows table)
│   └── package.json
└── frontend/
    ├── src/App.jsx  # flowchart canvas, inspector, code tab, activation, simulator
    ├── src/api.js   # REST client
    └── ...
```

## Prototype notes

- Bot flows, provider creds, and active state live in PostgreSQL (JSONB columns), so
  bots and their live webhooks survive server restarts. Chat sessions are still
  in-memory — move them to Redis/Postgres if you need conversations to survive
  restarts or want to run multiple backend instances.
- Provider creds are stored server-side and never returned to the browser; in
  production use env vars plus webhook signature validation (Twilio request
  signatures / Meta `X-Hub-Signature-256` / provider webhook tokens where available).
- Code export (tab 2) matches the active provider: Twilio, Meta Cloud API,
  Green API, or Whapi.cloud — all standalone and needing only `express`.
- Twilio replies use TwiML; Meta, Green API, and Whapi.cloud receive JSON
  webhooks and send replies through their REST APIs.
