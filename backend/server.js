// ============================================================
// FlowBot Backend — REST API + live WhatsApp provider webhooks.
// Storage: PostgreSQL (see store.js). Sessions: in-memory.
// Every activated bot gets its own provider webhook.
// ============================================================

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const store = require("./store");
const { handleMessage } = require("./engine");
const { generateStandalone } = require("./codegen");
const metaApi = require("./meta");
const greenApi = require("./green");
const whapi = require("./whapi");

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false })); // Twilio posts urlencoded

// async route wrapper → any thrown/rejected error hits the error middleware
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// In-memory chat sessions: key = botId + "|" + phone
const sessions = new Map();
const getSession = (key) => {
  if (!sessions.has(key)) sessions.set(key, { state: null, vars: {} });
  return sessions.get(key);
};

const NODE_LIMIT = 50;
const validateFlow = (body) => {
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) return "nodes and edges arrays required";
  if (body.nodes.length > NODE_LIMIT) return "too many blocks";
  return null;
};

/* ------------------- Flows CRUD ------------------- */
app.get("/api/flows", wrap(async (_req, res) => res.json(await store.list())));

app.get("/api/flows/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f) return res.status(404).json({ error: "not found" });
  // never leak auth tokens back to the client
  const { twilio, meta, green, whapi: whapiCreds, ...rest } = f;
  res.json({
    ...rest,
    twilio: twilio ? { sid: twilio.sid, number: twilio.number, hasToken: !!twilio.token } : null,
    meta: meta ? { phoneNumberId: meta.phoneNumberId, verifyToken: meta.verifyToken, hasToken: !!meta.accessToken } : null,
    green: green
      ? { idInstance: green.idInstance, apiUrl: green.apiUrl, hasToken: !!green.apiTokenInstance }
      : null,
    whapi: whapiCreds
      ? { apiUrl: whapiCreds.apiUrl, hasToken: !!whapiCreds.token }
      : null,
  });
}));

app.post("/api/flows", wrap(async (req, res) => {
  const err = validateFlow(req.body);
  if (err) return res.status(400).json({ error: err });
  const flow = await store.upsert({
    id: crypto.randomBytes(6).toString("hex"),
    name: (req.body.name || "Untitled bot").slice(0, 60),
    nodes: req.body.nodes,
    edges: req.body.edges,
    active: false,
  });
  res.status(201).json({ id: flow.id, name: flow.name });
}));

app.put("/api/flows/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f) return res.status(404).json({ error: "not found" });
  const err = validateFlow(req.body);
  if (err) return res.status(400).json({ error: err });
  await store.upsert({ id: f.id, name: (req.body.name || f.name).slice(0, 60), nodes: req.body.nodes, edges: req.body.edges });
  res.json({ ok: true });
}));

app.delete("/api/flows/:id", wrap(async (req, res) => {
  await store.remove(req.params.id);
  res.json({ ok: true });
}));

/* ------------------- Activation ------------------- */
app.post("/api/flows/:id/activate", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f) return res.status(404).json({ error: "not found" });
  if (!f.nodes.some((n) => n.type === "welcome"))
    return res.status(400).json({ error: "flow needs a Welcome block before activation" });

  const b = req.body || {};
  if (b.provider === "meta") {
    // Meta WhatsApp Cloud API — free test number, no credit card
    if (!b.accessToken || !b.phoneNumberId)
      return res.status(400).json({ error: "accessToken and phoneNumberId are required" });
    const verifyToken = f.meta?.verifyToken || crypto.randomBytes(12).toString("hex");
    await store.upsert({
      id: f.id,
      provider: "meta",
      meta: { accessToken: b.accessToken, phoneNumberId: b.phoneNumberId, verifyToken },
      active: true,
    });
    return res.json({ ok: true, provider: "meta", webhook: `/meta/webhook/${f.id}`, verifyToken });
  }

  if (b.provider === "green") {
    // Green API — hosted unofficial API, QR device pairing, REST send + webhook receive
    if (!b.idInstance || !b.apiTokenInstance)
      return res.status(400).json({ error: "idInstance and apiTokenInstance are required" });
    await store.upsert({
      id: f.id,
      provider: "green",
      green: {
        idInstance: String(b.idInstance).trim(),
        apiTokenInstance: b.apiTokenInstance,
        apiUrl: (b.apiUrl || greenApi.GREEN_API_BASE).replace(/\/+$/, ""),
      },
      active: true,
    });
    return res.json({ ok: true, provider: "green", webhook: `/green/webhook/${f.id}` });
  }

  if (b.provider === "whapi") {
    // Whapi.cloud — free sandbox, QR pairing, REST send + webhook receive
    if (!b.token) return res.status(400).json({ error: "token is required" });
    await store.upsert({
      id: f.id,
      provider: "whapi",
      whapi: {
        token: b.token,
        apiUrl: (b.apiUrl || whapi.WHAPI_API_BASE).replace(/\/+$/, ""),
      },
      active: true,
    });
    return res.json({ ok: true, provider: "whapi", webhook: `/whapi/webhook/${f.id}` });
  }

  // default: Twilio
  const { sid, token, number } = b;
  if (!sid || !token || !number) return res.status(400).json({ error: "sid, token and number are required" });
  await store.upsert({ id: f.id, provider: "twilio", twilio: { sid, token, number }, active: true });
  res.json({ ok: true, provider: "twilio", webhook: `/whatsapp/${f.id}` });
}));

app.post("/api/flows/:id/deactivate", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f) return res.status(404).json({ error: "not found" });
  await store.upsert({ id: f.id, active: false });
  res.json({ ok: true });
}));

/* ------------------- Simulator (same engine as webhook) ------------------- */
app.post("/api/flows/:id/simulate", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f) return res.status(404).json({ error: "not found" });
  const from = req.body.from || "simulator";
  const key = `${f.id}|${from}`;
  if (req.body.reset) sessions.delete(key);
  if (req.body.message === undefined) return res.json({ replies: [] });
  const replies = handleMessage(f, req.body.message, getSession(key));
  res.json({ replies });
}));

/* ------------------- Code export ------------------- */
app.get("/api/flows/:id/code", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f) return res.status(404).json({ error: "not found" });
  res.type("text/plain").send(generateStandalone(f));
}));

/* ------------------- Live Twilio webhook ------------------- */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const twiml = (msgs) =>
  '<?xml version="1.0" encoding="UTF-8"?><Response>' +
  msgs.map((m) => `<Message>${esc(m)}</Message>`).join("") +
  "</Response>";

app.post("/whatsapp/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !f.active || f.provider !== "twilio") return res.type("text/xml").send(twiml(["This bot is not active."]));
  const from = req.body.From || "unknown";
  const replies = handleMessage(f, req.body.Body || "", getSession(`${f.id}|${from}`));
  res.type("text/xml").send(twiml(replies));
}));

/* ------------------- Meta Cloud API webhook ------------------- */
// Verification handshake: Meta calls GET with hub.* params when you save the webhook URL
app.get("/meta/webhook/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && f?.meta?.verifyToken && token === f.meta.verifyToken) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
}));

// Incoming messages: parse payload, run the same engine, reply via Graph API
app.post("/meta/webhook/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !f.active || f.provider !== "meta" || !f.meta) return res.sendStatus(200); // always 200 so Meta doesn't retry forever
  const incoming = metaApi.extractIncoming(req.body);
  if (!incoming) return res.sendStatus(200); // delivery/read status events — nothing to do
  const replies = handleMessage(f, incoming.text, getSession(`${f.id}|${incoming.from}`));
  for (const msg of replies) {
    try {
      await metaApi.sendText(f.meta, incoming.from, msg);
    } catch (e) {
      console.error("Graph API send failed:", e.message);
    }
  }
  res.sendStatus(200);
}));

/* ------------------- Green API webhook ------------------- */
// Incoming messages: parse payload, run the same engine, reply via Green API REST
app.post("/green/webhook/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !f.active || f.provider !== "green" || !f.green) return res.sendStatus(200);
  const incoming = greenApi.extractIncoming(req.body);
  if (!incoming) return res.sendStatus(200);
  const replies = handleMessage(f, incoming.text, getSession(`${f.id}|${incoming.from}`));
  for (const msg of replies) {
    try {
      await greenApi.sendText(f.green, incoming.from, msg);
    } catch (e) {
      console.error("Green API send failed:", e.message);
    }
  }
  res.sendStatus(200);
}));

/* ------------------- Whapi.cloud webhook ------------------- */
// Incoming messages: parse payload, run the same engine, reply via Whapi REST
app.post("/whapi/webhook/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !f.active || f.provider !== "whapi" || !f.whapi) return res.sendStatus(200);
  const incoming = whapi.extractIncoming(req.body);
  if (!incoming) return res.sendStatus(200);
  const replies = handleMessage(f, incoming.text, getSession(`${f.id}|${incoming.from}`));
  for (const msg of replies) {
    try {
      await whapi.sendText(f.whapi, incoming.from, msg);
    } catch (e) {
      console.error("Whapi send failed:", e.message);
    }
  }
  res.sendStatus(200);
}));

app.get("/api/health", wrap(async (_req, res) => {
  await store.pool.query("SELECT 1");
  res.json({ ok: true, service: "flowbot-backend", db: "postgres" });
}));

/* ------------------- Built frontend (production deploys) ------------------- */
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

/* ------------------- Error middleware ------------------- */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

/* ------------------- Startup: init DB, then listen ------------------- */
store
  .init()
  .then(() => {
    app.listen(PORT, () => console.log(`FlowBot backend on http://localhost:${PORT} (Postgres)`));
  })
  .catch((e) => {
    console.error("Failed to connect to Postgres. Set DATABASE_URL or start the DB (docker compose up -d).");
    console.error(e.message);
    process.exit(1);
  });
