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
const auth = require("./auth");
const { handleMessage } = require("./engine");
const { generateFlow } = require("./assistant");
const { generateStandalone, generateProject } = require("./codegen");
const { buildZip } = require("./zip");
const metaApi = require("./meta");
const greenApi = require("./green");
const whapi = require("./whapi");
const whintaApi = require("./whinta");
const twilioApi = require("./twilio");

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false })); // Twilio posts urlencoded

// async route wrapper → any thrown/rejected error hits the error middleware
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Chat sessions persist in Postgres (key = botId + "|" + sender), so live
// conversations survive restarts and deploys. runBot handles one incoming
// message end-to-end: load session → engine → save session → log analytics
// events, message history and the per-block funnel trace (the simulator is
// excluded from all logging). When the owner has taken a conversation over
// from the inbox (session.agentMode), the bot stays silent.
async function runBot(flow, channel, from, text) {
  const key = `${flow.id}|${from}`;
  const session = (await store.getChatSession(key)) || { state: null, vars: {} };
  const live = channel !== "simulator";
  if (live) session.channel = channel;
  if (live && session.agentMode) {
    await store.saveChatSession(key, flow.id, session);
    store.logChatMessages(flow.id, key, channel, [["in", text]]).catch(() => {});
    return [];
  }
  const trace = live ? [] : null;
  const replies = await handleMessage(flow, text, session, trace);
  await store.saveChatSession(key, flow.id, session);
  if (live) {
    store.logEvent(flow.id, channel, key, replies.length).catch(() => {});
    if (trace.length) store.logNodeEvents(flow.id, key, trace).catch(() => {});
    store.logChatMessages(flow.id, key, channel, [["in", text], ...replies.map((r) => ["out", r])]).catch(() => {});
  }
  return replies;
}
setInterval(() => {
  store.cleanupChatSessions(12).catch(() => {});
  store.cleanupChatMessages(30).catch(() => {});
}, 10 * 60 * 1000).unref();

// Push a message to a customer on whatever channel they used. Widget/share
// conversations have no push channel — the chat page polls for agent replies.
async function sendToCustomer(flow, channel, to, text) {
  if (channel === "twilio" && flow.twilio) return twilioApi.sendText(flow.twilio, to, text);
  if (channel === "meta" && flow.meta) return metaApi.sendText(flow.meta, to, text);
  if (channel === "green" && flow.green) return greenApi.sendText(flow.green, to, text);
  if (channel === "whapi" && flow.whapi) return whapi.sendText(flow.whapi, to, text);
  if (channel === "whinta" && flow.whinta) return whintaApi.sendText(flow.whinta, to, text);
  if (channel === "widget") return; // delivered by the widget's poll
  throw new Error(`no credentials to send on channel "${channel}"`);
}

const NODE_LIMIT = 150;
const STEP_KINDS = new Set(["say", "ask", "set", "api", "ai", "choice"]);
const STEP_LIMIT = 30;

// steps power user-made custom blocks — validate their shape wherever they arrive
const validateSteps = (steps) => {
  if (!Array.isArray(steps)) return "steps must be an array";
  if (steps.length > STEP_LIMIT) return `a custom block can have at most ${STEP_LIMIT} steps`;
  for (const s of steps) {
    if (!s || typeof s !== "object" || Array.isArray(s)) return "every step must be an object";
    if (!STEP_KINDS.has(s.kind)) return "step kind must be say, ask, set, api, ai or choice";
    if (s.kind === "choice" && (!Array.isArray(s.options) || !s.options.length || s.options.length > 8))
      return "a choice step needs 1-8 options";
    if (s.kind === "api" && typeof s.url !== "string") return "an api step needs a url";
  }
  return null;
};

const validateFlow = (body) => {
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) return "nodes and edges arrays required";
  if (body.nodes.length > NODE_LIMIT) return "too many blocks";
  if (body.edges.length > NODE_LIMIT * 8) return "too many connections";
  const ids = new Set();
  for (const n of body.nodes) {
    if (!n || typeof n.id !== "string" || typeof n.type !== "string") return "every block needs an id and a type";
    if (n.config !== undefined && (typeof n.config !== "object" || n.config === null || Array.isArray(n.config))) return "block config must be an object";
    if (n.type === "custom") {
      const err = validateSteps(n.config?.steps ?? []);
      if (err) return err;
    }
    if (ids.has(n.id)) return "duplicate block id";
    ids.add(n.id);
  }
  for (const e of body.edges) {
    if (!e || !ids.has(e.from) || !ids.has(e.to)) return "a connection references a missing block";
  }
  return null;
};

/* ------------------- Auth ------------------- */
app.post("/api/auth/signup", wrap(auth.signup));
app.post("/api/auth/login", wrap(auth.login));
app.post("/api/auth/logout", auth.requireAuth, wrap(auth.logout));
app.get("/api/auth/me", auth.requireAuth, wrap(auth.me));

// everything under /api/flows requires a logged-in user
app.use("/api/flows", auth.requireAuth);

// a user can touch their own flows; pre-auth flows (no owner) stay reachable
// and are claimed by whoever saves them next
const owns = (f, req) => !f.userId || f.userId === req.user.id;

/* ------------------- Custom feature blocks (Block Lab) ------------------- */
app.use("/api/blocks", auth.requireAuth);

const cleanBlock = (body) => ({
  name: String(body.name || "My block").slice(0, 40),
  icon: String(body.icon || "🧩").slice(0, 8),
  color: /^#[0-9a-fA-F]{6}$/.test(body.color || "") ? body.color : "#9BE8C0",
  descr: String(body.descr || "").slice(0, 120),
  steps: body.steps || [],
});

app.get("/api/blocks", wrap(async (req, res) => res.json(await store.listBlocks(req.user.id))));

app.post("/api/blocks", wrap(async (req, res) => {
  const b = cleanBlock(req.body);
  const err = validateSteps(b.steps);
  if (err) return res.status(400).json({ error: err });
  if (!b.steps.length) return res.status(400).json({ error: "add at least one step" });
  const saved = await store.upsertBlock({ id: crypto.randomBytes(6).toString("hex"), userId: req.user.id, ...b });
  res.status(201).json(saved);
}));

app.put("/api/blocks/:id", wrap(async (req, res) => {
  const existing = await store.getBlock(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "not found" });
  const b = cleanBlock(req.body);
  const err = validateSteps(b.steps);
  if (err) return res.status(400).json({ error: err });
  if (!b.steps.length) return res.status(400).json({ error: "add at least one step" });
  const saved = await store.upsertBlock({ id: existing.id, userId: req.user.id, ...b });
  res.json(saved);
}));

app.delete("/api/blocks/:id", wrap(async (req, res) => {
  await store.removeBlock(req.params.id, req.user.id);
  res.json({ ok: true });
}));

/* ------------------- Flows CRUD ------------------- */
app.get("/api/flows", wrap(async (req, res) => res.json(await store.list(req.user.id))));

app.get("/api/flows/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
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
    userId: req.user.id,
  });
  res.status(201).json({ id: flow.id, name: flow.name });
}));

app.put("/api/flows/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const err = validateFlow(req.body);
  if (err) return res.status(400).json({ error: err });
  await store.upsert({ id: f.id, name: (req.body.name || f.name).slice(0, 60), nodes: req.body.nodes, edges: req.body.edges, userId: req.user.id });
  res.json({ ok: true });
}));

app.delete("/api/flows/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (f && !owns(f, req)) return res.status(404).json({ error: "not found" });
  await store.remove(req.params.id);
  res.json({ ok: true });
}));

/* ------------------- Activation ------------------- */
app.post("/api/flows/:id/activate", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
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

  if (b.provider === "whinta") {
    // Whinta (app.whinta.com) — WhatsApp CRM. REST send via /api/send + webhook receive.
    if (!b.token) return res.status(400).json({ error: "token is required" });
    await store.upsert({
      id: f.id,
      provider: "whinta",
      whinta: {
        token: b.token,
        apiUrl: (b.apiUrl || whintaApi.WHINTA_API_BASE).replace(/\/+$/, ""),
      },
      active: true,
    });
    return res.json({ ok: true, provider: "whinta", webhook: `/whinta/webhook/${f.id}` });
  }

  // default: Twilio
  const { sid, token, number } = b;
  if (!sid || !token || !number) return res.status(400).json({ error: "sid, token and number are required" });
  await store.upsert({ id: f.id, provider: "twilio", twilio: { sid, token, number }, active: true });
  res.json({ ok: true, provider: "twilio", webhook: `/whatsapp/${f.id}` });
}));

app.post("/api/flows/:id/deactivate", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  await store.upsert({ id: f.id, active: false });
  res.json({ ok: true });
}));

/* ------------------- AI Builder assistant (BYOK — user's own key) ------------------- */
// Open to guests like the canvas itself: it only proxies the requester's own
// LLM key to their chosen provider and validates the generated flow. Nothing
// is stored; the bot runtime stays deterministic.
app.post("/api/assistant", wrap(async (req, res) => {
  const b = req.body || {};
  if (!String(b.apiKey || "").trim()) return res.status(400).json({ error: "add your AI provider API key in the panel first" });
  if (!String(b.message || "").trim()) return res.status(400).json({ error: "describe the bot you want" });
  try {
    const result = await generateFlow(
      { provider: b.provider, apiKey: String(b.apiKey).trim(), model: b.model, baseUrl: b.baseUrl },
      String(b.message).slice(0, 2000),
      Array.isArray(b.history) ? b.history.slice(-8) : [],
      b.currentFlow
    );
    const err = validateFlow(result.flow);
    if (err) return res.status(422).json({ error: `generated flow was invalid (${err}) — try again` });
    res.json(result);
  } catch (e) {
    res.status(422).json({ error: e.message || "generation failed — try again" });
  }
}));

/* ------------------- Simulator (same engine as webhook) ------------------- */
app.post("/api/flows/:id/simulate", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const from = req.body.from || "simulator";
  if (req.body.reset) await store.deleteChatSession(`${f.id}|${from}`);
  if (req.body.message === undefined) return res.json({ replies: [] });
  const replies = await runBot(f, "simulator", from, req.body.message);
  res.json({ replies });
}));

/* ------------------- Code export ------------------- */
app.get("/api/flows/:id/code", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  res.type("text/plain").send(generateStandalone(f));
}));

// full project (server.js + package.json + README + .env.example) as a ZIP
app.get("/api/flows/:id/code.zip", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const safe = (f.name || "flowbot").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "flowbot";
  res.set("Content-Type", "application/zip");
  res.set("Content-Disposition", `attachment; filename="${safe}-bot.zip"`);
  res.send(buildZip(generateProject(f)));
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
  const replies = await runBot(f, "twilio", from, req.body.Body || "");
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
  const replies = await runBot(f, "meta", incoming.from, incoming.text);
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
  const replies = await runBot(f, "green", incoming.from, incoming.text);
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
  const replies = await runBot(f, "whapi", incoming.from, incoming.text);
  for (const msg of replies) {
    try {
      await whapi.sendText(f.whapi, incoming.from, msg);
    } catch (e) {
      console.error("Whapi send failed:", e.message);
    }
  }
  res.sendStatus(200);
}));

/* ------------------- Whinta (app.whinta.com) webhook ------------------- */
// Demo helper: clear a bot's chat session so a fresh chat starts at Welcome.
app.get("/whinta/_reset", wrap(async (req, res) => {
  if (req.query.k !== "whinta-debug") return res.sendStatus(404);
  if (req.query.key) await store.deleteChatSession(String(req.query.key));
  res.json({ reset: req.query.key || null });
}));
// Incoming messages: parse Whinta's payload, run the same engine, reply via
// Whinta's POST /api/send. Whinta also posts Message.Sent/Status events — those
// are ignored by extractIncoming so the bot never talks to itself.
app.post("/whinta/webhook/:id", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !f.active || f.provider !== "whinta" || !f.whinta) return res.sendStatus(200);
  const incoming = whintaApi.extractIncoming(req.body);
  if (!incoming || !incoming.text) return res.sendStatus(200);
  const replies = await runBot(f, "whinta", incoming.from, incoming.text);
  for (const msg of replies) {
    try {
      await whintaApi.sendText(f.whinta, incoming.from, msg);
    } catch (e) {
      console.error("Whinta send failed:", e.message);
    }
  }
  res.sendStatus(200);
}));

/* ------------------- Public bot surfaces: widget embed, chat page, share page ------------------- */
const widgetPages = require("./widget");
const { CANONICAL } = require("./seo");

// enable/disable the public surfaces; the key is generated once and reused
app.post("/api/flows/:id/publish", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const b = req.body || {};
  const saved = await store.setPublic(f.id, {
    publicKey: f.publicKey || crypto.randomBytes(9).toString("base64url"),
    widgetEnabled: typeof b.widget === "boolean" ? b.widget : undefined,
    shareEnabled: typeof b.share === "boolean" ? b.share : undefined,
  });
  res.json({ publicKey: saved.publicKey, widgetEnabled: saved.widgetEnabled, shareEnabled: saved.shareEnabled });
}));

// owner analytics: last-30-day totals, daily series, channel breakdown
app.get("/api/flows/:id/analytics", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  res.json(await store.analytics(f.id, 30));
}));

// funnel overlay: how many conversations reached each block (last 30 days)
app.get("/api/flows/:id/funnel", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  res.json(await store.funnel(f.id, 30));
}));

/* ------------------- Live inbox: history + human takeover ------------------- */
app.get("/api/flows/:id/inbox", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  res.json({ conversations: await store.inboxList(f.id) });
}));

app.get("/api/flows/:id/inbox/thread", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const key = String(req.query.key || "");
  if (!key.startsWith(`${f.id}|`)) return res.status(400).json({ error: "invalid conversation key" });
  res.json(await store.inboxThread(f.id, key));
}));

// toggle takeover: on = bot goes silent for this conversation, off = bot resumes
app.post("/api/flows/:id/inbox/agent", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const key = String(req.body.key || "");
  if (!key.startsWith(`${f.id}|`)) return res.status(400).json({ error: "invalid conversation key" });
  const data = await store.setAgentMode(key, f.id, !!req.body.on);
  res.json({ agentMode: data.agentMode === true });
}));

// owner replies by hand; takeover switches on automatically so the bot
// doesn't talk over the human
app.post("/api/flows/:id/inbox/send", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const key = String(req.body.key || "");
  const message = String(req.body.message || "").trim().slice(0, 1500);
  if (!key.startsWith(`${f.id}|`)) return res.status(400).json({ error: "invalid conversation key" });
  if (!message) return res.status(400).json({ error: "message is required" });
  const thread = await store.inboxThread(f.id, key, 1);
  const channel = thread.channel;
  if (!channel) return res.status(400).json({ error: "conversation has no messages yet" });
  const to = key.slice(f.id.length + 1);
  try {
    await sendToCustomer(f, channel, to, message);
  } catch (e) {
    return res.status(502).json({ error: `send failed: ${e.message}` });
  }
  await store.setAgentMode(key, f.id, true);
  await store.logChatMessages(f.id, key, channel, [["agent", message]]);
  res.json({ ok: true, agentMode: true });
}));

/* ------------------- Broadcasts ------------------- */
// reachable contacts = everyone who messaged on the bot's current provider;
// widget visitors can't be pushed to, so they're never included
app.get("/api/flows/:id/broadcasts", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const channel = f.active ? f.provider : null;
  const contacts = channel ? (await store.broadcastContacts(f.id, channel)).length : 0;
  res.json({ channel, active: !!f.active, contacts, broadcasts: await store.listBroadcasts(f.id) });
}));

app.post("/api/flows/:id/broadcasts", wrap(async (req, res) => {
  const f = await store.get(req.params.id);
  if (!f || !owns(f, req)) return res.status(404).json({ error: "not found" });
  const message = String(req.body.message || "").trim().slice(0, 1500);
  if (!message) return res.status(400).json({ error: "message is required" });
  if (!f.active) return res.status(400).json({ error: "activate your bot on a WhatsApp provider first" });
  const contacts = await store.broadcastContacts(f.id, f.provider);
  if (!contacts.length) return res.status(400).json({ error: "no contacts yet — people who message your bot become reachable" });
  const b = await store.createBroadcast({ id: crypto.randomBytes(6).toString("hex"), botId: f.id, message, total: contacts.length });
  res.status(201).json(b);
}));

// scheduler: pick up queued broadcasts and send with a gentle pace so
// provider rate limits stay comfortable
async function processBroadcasts() {
  const due = await store.claimDueBroadcasts();
  for (const b of due) {
    let sent = 0, failed = 0;
    try {
      const f = await store.get(b.bot_id);
      if (!f || !f.active) throw new Error("bot inactive");
      const contacts = await store.broadcastContacts(f.id, f.provider);
      for (const to of contacts) {
        try {
          await sendToCustomer(f, f.provider, to, b.message);
          store.logChatMessages(f.id, `${f.id}|${to}`, f.provider, [["agent", b.message]]).catch(() => {});
          sent++;
        } catch {
          failed++;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      await store.finishBroadcast(b.id, { status: failed && !sent ? "failed" : "done", sent, failed });
    } catch (e) {
      console.error(`broadcast ${b.id} failed:`, e.message);
      await store.finishBroadcast(b.id, { status: "failed", sent, failed }).catch(() => {});
    }
  }
}
setInterval(() => processBroadcasts().catch((e) => console.error("broadcast tick failed:", e.message)), 15000).unref();

// Two-tier rate limit for the public chat API. Tight enough to stop floods,
// loose enough that a fast human demo (or a few visitors behind one office
// NAT) never trips it: 30 msgs/min per visitor session, 120 msgs/min per IP.
const RATE_WINDOW_MS = 60000;
const chatBuckets = new Map();
const bucketAllowed = (k, limit) => {
  const now = Date.now();
  const recent = (chatBuckets.get(k) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= limit) return false;
  recent.push(now);
  chatBuckets.set(k, recent);
  return true;
};
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of chatBuckets) if (!b.some((t) => now - t < RATE_WINDOW_MS)) chatBuckets.delete(k);
}, 60000).unref();

app.post("/api/public/:key/chat", wrap(async (req, res) => {
  const f = await store.getByPublicKey(req.params.key);
  if (!f || (!f.widgetEnabled && !f.shareEnabled)) return res.status(404).json({ error: "bot not found" });
  const sid = String(req.body.sessionId || "");
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(sid)) return res.status(400).json({ error: "invalid session" });
  const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
  if (!bucketAllowed(`s|${req.params.key}|${ip}|${sid}`, 30) || !bucketAllowed(`i|${req.params.key}|${ip}`, 120))
    return res.status(429).json({ error: "Too many messages — please slow down." });
  const from = `web:${sid}`;
  if (req.body.reset) await store.deleteChatSession(`${f.id}|${from}`);
  const replies = await runBot(f, "widget", from, String(req.body.message ?? "").slice(0, 1000));
  res.json({ replies });
}));

// widget poll: agent (human) replies since `after`, plus whether a human has
// taken over. First call omits `after` and just learns the current cursor, so
// old agent messages never replay on page reload.
app.get("/api/public/:key/updates", wrap(async (req, res) => {
  const f = await store.getByPublicKey(req.params.key);
  if (!f || (!f.widgetEnabled && !f.shareEnabled)) return res.status(404).json({ error: "bot not found" });
  const sid = String(req.query.sessionId || "");
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(sid)) return res.status(400).json({ error: "invalid session" });
  const ip = String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
  if (!bucketAllowed(`u|${req.params.key}|${ip}|${sid}`, 40))
    return res.status(429).json({ error: "too many requests" });
  const key = `${f.id}|web:${sid}`;
  const after = /^\d+$/.test(String(req.query.after ?? "")) ? Number(req.query.after) : null;
  const { last, messages } = await store.agentMessagesAfter(f.id, key, after);
  const session = await store.peekChatSession(key);
  res.json({ last, messages, agent: session?.agentMode === true });
}));

// flow JSON for "clone this bot" — secrets never leave the server:
// BYOK AI keys are blanked, API header values dropped, URL queries stripped
const sanitizeFlowForShare = (f) => {
  const nodes = JSON.parse(JSON.stringify(f.nodes || []));
  const stripUrl = (u) => { try { const x = new URL(u); return x.origin + x.pathname; } catch { return u; } };
  const scrubApi = (c) => {
    if (Array.isArray(c.headers)) c.headers = c.headers.map((h) => ({ key: h?.key || "", value: "" }));
    if (c.url) c.url = stripUrl(c.url);
    if (c.body) c.body = "";
  };
  for (const n of nodes) {
    const c = n.config || {};
    if (n.type === "ai_reply") c.apiKey = "";
    if (n.type === "http_request") scrubApi(c);
    if (n.type === "custom" && Array.isArray(c.steps)) {
      for (const s of c.steps) {
        if (s.kind === "ai") s.apiKey = "";
        if (s.kind === "api") scrubApi(s);
      }
    }
  }
  return { name: f.name, nodes, edges: f.edges || [] };
};

app.get("/api/share/:key/flow", wrap(async (req, res) => {
  const f = await store.getByPublicKey(req.params.key);
  if (!f || !f.shareEnabled) return res.status(404).json({ error: "not found" });
  res.json(sanitizeFlowForShare(f));
}));

app.get("/widget.js", (_req, res) => {
  res.type("application/javascript").set("Cache-Control", "public, max-age=3600")
    .send(widgetPages.renderWidgetJs(CANONICAL));
});

const publicGoneHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bot not available — FlowBot</title><meta name="robots" content="noindex"><style>body{font-family:system-ui,sans-serif;background:#f4f8f5;color:#17301f;display:grid;place-items:center;min-height:100vh;margin:0}main{text-align:center;padding:24px}a{color:#0e7a4b}</style></head><body><main><h1>This bot isn't available</h1><p>The owner may have unpublished it. <a href="/">Build your own WhatsApp bot free →</a></p></main></body></html>`;

app.get("/chat/:key", wrap(async (req, res) => {
  const f = await store.getByPublicKey(req.params.key);
  if (!f || (!f.widgetEnabled && !f.shareEnabled)) return res.status(404).type("html").send(publicGoneHtml);
  res.type("html").send(widgetPages.renderChatPage(f, req.params.key, CANONICAL));
}));

app.get("/share/:key", wrap(async (req, res) => {
  const f = await store.getByPublicKey(req.params.key);
  if (!f || !f.shareEnabled) return res.status(404).type("html").send(publicGoneHtml);
  res.type("html").send(widgetPages.renderSharePage(f, req.params.key, CANONICAL));
}));

app.get("/api/health", wrap(async (_req, res) => {
  await store.pool.query("SELECT 1");
  res.json({ ok: true, service: "flowbot-backend", db: "postgres" });
}));

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, service: "flowbot-backend" });
});

/* ------------------- SEO: pages, robots.txt, sitemap.xml, llms.txt ------------------- */
const seo = require("./seo");

// Consolidate ranking signals on the canonical domain: platform subdomains
// (e.g. *.up.railway.app) 301 to flochatbot.com for page GETs. Webhook and
// API paths are exempt so provider callbacks configured against the platform
// domain keep working.
const NEVER_REDIRECT = ["/api/", "/meta/", "/green/", "/whapi/", "/whatsapp/"];
app.use((req, res, next) => {
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (
    (req.method === "GET" || req.method === "HEAD") &&
    /\.(up\.railway\.app|onrender\.com)$/i.test(host) &&
    !NEVER_REDIRECT.some((p) => req.path === p.slice(0, -1) || req.path.startsWith(p))
  ) {
    return res.redirect(301, seo.CANONICAL + req.originalUrl);
  }
  next();
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /meta/\nDisallow: /green/\nDisallow: /whapi/\nDisallow: /whatsapp/\n\nSitemap: ${seo.CANONICAL}/sitemap.xml\n`
  );
});

const docs = require("./docs");
const compare = require("./compare");
const templatePages = require("./template-pages");

// docs + competitor-comparison + template-gallery pages all feed sitemap + llms.txt
const extraEntries = [...docs.entries, ...compare.entries, ...templatePages.entries];

// Explicit short cache: without a Cache-Control header Railway's edge caches
// these for hours, so crawlers kept getting a pre-deploy sitemap.
app.get("/sitemap.xml", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300").type("application/xml").send(seo.sitemapXml(extraEntries));
});

app.get("/llms.txt", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300").type("text/plain").send(seo.llmsTxt(extraEntries));
});

// Marketing/content pages + competitor-comparison + template-gallery pages are pre-rendered once.
for (const page of [...seo.pages, ...compare.pages, ...templatePages.pages]) {
  const html = seo.renderPage(page);
  app.get(page.path, (_req, res) => {
    res.set("Cache-Control", "public, max-age=300").type("html").send(html);
  });
}

// Documentation pages — same treatment.
for (const doc of docs.DOCS) {
  const html = docs.renderDoc(doc);
  app.get(docs.docPath(doc), (_req, res) => {
    res.set("Cache-Control", "public, max-age=300").type("html").send(html);
  });
}

/* ------------------- Built frontend (production deploys) ------------------- */
// The app itself lives at /app; hashed build assets get long-lived caching.
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(
    express.static(frontendDist, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.set("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );
  app.get("/app", (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Real 404s (instead of soft-404ing every unknown URL with the app shell).
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not found" });
  res
    .status(404)
    .type("html")
    .send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found — FlowBot</title><meta name="robots" content="noindex"><style>body{font-family:system-ui,sans-serif;background:#f4f8f5;color:#17301f;display:grid;place-items:center;min-height:100vh;margin:0}main{text-align:center;padding:24px}a{color:#0e7a4b}</style></head><body><main><h1>404 — page not found</h1><p>That page doesn't exist. Try the <a href="/">FlowBot home page</a> or <a href="/app">open the bot builder</a>.</p></main></body></html>`
    );
});

/* ------------------- Error middleware ------------------- */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

/* ------------------- Startup: init DB, then listen ------------------- */
// Retry in-process so a DB that's a few seconds late (private networking DNS,
// container ordering) doesn't turn into a crash-restart loop and a failed
// healthcheck. Each attempt is bounded by the pool's connection timeout.
const DB_INIT_ATTEMPTS = 5;
(async () => {
  console.log(`Connecting to Postgres at ${store.dbTarget()}...`);
  for (let attempt = 1; ; attempt++) {
    try {
      await store.init();
      break;
    } catch (e) {
      console.error(`Postgres init failed (attempt ${attempt}/${DB_INIT_ATTEMPTS}): ${e.message}`);
      if (attempt >= DB_INIT_ATTEMPTS) {
        console.error("Failed to connect to Postgres. Set DATABASE_URL or start the DB (docker compose up -d).");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  app.listen(PORT, () => console.log(`FlowBot backend on http://localhost:${PORT} (Postgres)`));
})();
