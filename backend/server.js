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

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false })); // Twilio posts urlencoded

// async route wrapper → any thrown/rejected error hits the error middleware
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// In-memory chat sessions: key = botId + "|" + phone.
// Idle sessions expire so the map can't grow without bound.
const SESSION_TTL_MS = 60 * 60 * 1000;
const sessions = new Map();
const getSession = (key) => {
  if (!sessions.has(key)) sessions.set(key, { state: null, vars: {} });
  const s = sessions.get(key);
  s.lastSeen = Date.now();
  return s;
};
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [key, s] of sessions) if ((s.lastSeen || 0) < cutoff) sessions.delete(key);
}, 10 * 60 * 1000).unref();

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
  const key = `${f.id}|${from}`;
  if (req.body.reset) sessions.delete(key);
  if (req.body.message === undefined) return res.json({ replies: [] });
  const replies = await handleMessage(f, req.body.message, getSession(key));
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
  const replies = await handleMessage(f, req.body.Body || "", getSession(`${f.id}|${from}`));
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
  const replies = await handleMessage(f, incoming.text, getSession(`${f.id}|${incoming.from}`));
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
  const replies = await handleMessage(f, incoming.text, getSession(`${f.id}|${incoming.from}`));
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
  const replies = await handleMessage(f, incoming.text, getSession(`${f.id}|${incoming.from}`));
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

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, service: "flowbot-backend" });
});

/* ------------------- SEO: robots.txt + sitemap.xml ------------------- */
// Generated from the request host so they stay correct on any domain
// (Render, Railway, custom domain) without hardcoding.
const siteBase = (req) => {
  const proto = req.headers["x-forwarded-proto"]?.split(",")[0] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"]?.split(",")[0] || req.headers.host || "localhost";
  return `${proto}://${host}`;
};

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /meta/\nDisallow: /green/\nDisallow: /whapi/\nDisallow: /whatsapp/\n\nSitemap: ${siteBase(req)}/sitemap.xml\n`
  );
});

app.get("/sitemap.xml", (req, res) => {
  const base = siteBase(req);
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${base}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`
  );
});

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
