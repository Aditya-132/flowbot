// ============================================================
// Postgres persistence layer for bot flows.
// Same interface as before (list/get/upsert/remove) — now async.
// Table is auto-created on startup.
// ============================================================

const { Pool } = require("pg");

const DB_URL =
  process.env.DATABASE_URL || "postgres://flowbot:flowbot@localhost:5432/flowbot";

const pool = new Pool({
  connectionString: DB_URL,
  // Fail fast instead of hanging forever when the DB host is unreachable
  // (e.g. platform private networking not ready yet) — startup retries instead.
  connectionTimeoutMillis: 10000,
});

// Host:port only — safe to log, and tells deploy logs which DB is being dialed.
function dbTarget() {
  try {
    const u = new URL(DB_URL);
    return `${u.hostname}:${u.port || 5432}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flows (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL DEFAULT 'Untitled bot',
      nodes      JSONB NOT NULL DEFAULT '[]',
      edges      JSONB NOT NULL DEFAULT '[]',
      twilio     JSONB,
      meta       JSONB,
      green      JSONB,
      whapi      JSONB,
      whinta     JSONB,
      provider   TEXT NOT NULL DEFAULT 'twilio',
      active     BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // migrations for databases created before newer provider adapters existed
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS meta JSONB;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS green JSONB;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS whapi JSONB;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS whinta JSONB;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'twilio';`);

  // auth: user accounts + bearer-token sessions; flows are owned per user
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;`);

  // user-designed custom feature blocks (Block Lab)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_blocks (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      icon       TEXT NOT NULL DEFAULT '🧩',
      color      TEXT NOT NULL DEFAULT '#9BE8C0',
      descr      TEXT NOT NULL DEFAULT '',
      steps      JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // public exposure: one key serves both the website widget and the share page
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS public_key TEXT UNIQUE;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS widget_enabled BOOLEAN NOT NULL DEFAULT false;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN NOT NULL DEFAULT false;`);

  // chat sessions persist across restarts/deploys (were in-memory before)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      key       TEXT PRIMARY KEY,
      bot_id    TEXT NOT NULL,
      data      JSONB NOT NULL DEFAULT '{}',
      last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS chat_sessions_seen ON chat_sessions (last_seen);`);

  // one row per handled incoming message — powers per-bot analytics
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_events (
      id          BIGSERIAL PRIMARY KEY,
      bot_id      TEXT NOT NULL,
      channel     TEXT NOT NULL,
      session_key TEXT,
      out_count   INT NOT NULL DEFAULT 0,
      ts          TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS bot_events_bot_ts ON bot_events (bot_id, ts);`);

  // one row per block a conversation reached — powers the canvas funnel overlay
  await pool.query(`
    CREATE TABLE IF NOT EXISTS node_events (
      id          BIGSERIAL PRIMARY KEY,
      bot_id      TEXT NOT NULL,
      session_key TEXT NOT NULL,
      node_id     TEXT NOT NULL,
      ts          TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS node_events_bot_ts ON node_events (bot_id, ts);`);

  // full message history per conversation — powers the live inbox
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          BIGSERIAL PRIMARY KEY,
      bot_id      TEXT NOT NULL,
      session_key TEXT NOT NULL,
      channel     TEXT NOT NULL DEFAULT '',
      direction   TEXT NOT NULL,
      body        TEXT NOT NULL,
      ts          TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS chat_messages_session ON chat_messages (bot_id, session_key, id);`);

  // owner-composed campaigns sent to every past contact on the bot's provider
  await pool.query(`
    CREATE TABLE IF NOT EXISTS broadcasts (
      id         TEXT PRIMARY KEY,
      bot_id     TEXT NOT NULL,
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'queued',
      send_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      total      INT NOT NULL DEFAULT 0,
      sent_count INT NOT NULL DEFAULT 0,
      fail_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

const rowToFlow = (r) =>
  r && {
    id: r.id,
    name: r.name,
    nodes: r.nodes,
    edges: r.edges,
    twilio: r.twilio,
    meta: r.meta,
    green: r.green,
    whapi: r.whapi,
    whinta: r.whinta,
    provider: r.provider,
    active: r.active,
    userId: r.user_id,
    updatedAt: r.updated_at,
    publicKey: r.public_key,
    widgetEnabled: r.widget_enabled,
    shareEnabled: r.share_enabled,
  };

module.exports = {
  init,
  pool,
  dbTarget,

  list: async (userId) => {
    const { rows } = await pool.query(
      `SELECT id, name, active, updated_at, jsonb_array_length(nodes) AS blocks
       FROM flows WHERE user_id = $1 OR user_id IS NULL ORDER BY updated_at DESC`,
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      active: r.active,
      updatedAt: r.updated_at,
      blocks: Number(r.blocks),
    }));
  },

  get: async (id) => {
    const { rows } = await pool.query(`SELECT * FROM flows WHERE id = $1`, [id]);
    return rowToFlow(rows[0]);
  },

  upsert: async (flow) => {
    const { rows } = await pool.query(
      `INSERT INTO flows (id, name, nodes, edges, twilio, meta, green, whapi, whinta, provider, active, user_id, updated_at)
       VALUES ($1, COALESCE($2, 'Untitled bot'), COALESCE($3, '[]'::jsonb),
               COALESCE($4, '[]'::jsonb), $5, $6, $7, $8, $12, COALESCE($9, 'twilio'), COALESCE($10, false), $11, now())
       ON CONFLICT (id) DO UPDATE SET
         name       = COALESCE($2, flows.name),
         nodes      = COALESCE($3, flows.nodes),
         edges      = COALESCE($4, flows.edges),
         twilio     = COALESCE($5, flows.twilio),
         meta       = COALESCE($6, flows.meta),
         green      = COALESCE($7, flows.green),
         whapi      = COALESCE($8, flows.whapi),
         whinta     = COALESCE($12, flows.whinta),
         provider   = COALESCE($9, flows.provider),
         active     = COALESCE($10, flows.active),
         user_id    = COALESCE($11, flows.user_id),
         updated_at = now()
       RETURNING *`,
      [
        flow.id,
        flow.name ?? null,
        flow.nodes ? JSON.stringify(flow.nodes) : null,
        flow.edges ? JSON.stringify(flow.edges) : null,
        flow.twilio ? JSON.stringify(flow.twilio) : null,
        flow.meta ? JSON.stringify(flow.meta) : null,
        flow.green ? JSON.stringify(flow.green) : null,
        flow.whapi ? JSON.stringify(flow.whapi) : null,
        flow.provider ?? null,
        typeof flow.active === "boolean" ? flow.active : null,
        flow.userId ?? null,
        flow.whinta ? JSON.stringify(flow.whinta) : null,
      ]
    );
    return rowToFlow(rows[0]);
  },

  remove: async (id) => {
    await pool.query(`DELETE FROM flows WHERE id = $1`, [id]);
    await pool.query(`DELETE FROM chat_sessions WHERE bot_id = $1`, [id]);
    await pool.query(`DELETE FROM bot_events WHERE bot_id = $1`, [id]);
  },

  /* ---------- public exposure (widget embed + share page) ---------- */
  getByPublicKey: async (key) => {
    const { rows } = await pool.query(`SELECT * FROM flows WHERE public_key = $1`, [key]);
    return rowToFlow(rows[0]);
  },

  setPublic: async (id, { publicKey, widgetEnabled, shareEnabled }) => {
    const { rows } = await pool.query(
      `UPDATE flows SET
         public_key     = COALESCE($2, public_key),
         widget_enabled = COALESCE($3, widget_enabled),
         share_enabled  = COALESCE($4, share_enabled)
       WHERE id = $1 RETURNING *`,
      [id, publicKey ?? null, widgetEnabled ?? null, shareEnabled ?? null]
    );
    return rowToFlow(rows[0]);
  },

  /* ---------- chat sessions (persist across restarts) ---------- */
  getChatSession: async (key) => {
    const { rows } = await pool.query(
      `UPDATE chat_sessions SET last_seen = now() WHERE key = $1 RETURNING data`,
      [key]
    );
    return rows[0] ? rows[0].data : null;
  },

  saveChatSession: async (key, botId, data) => {
    await pool.query(
      `INSERT INTO chat_sessions (key, bot_id, data, last_seen) VALUES ($1, $2, $3, now())
       ON CONFLICT (key) DO UPDATE SET data = $3, last_seen = now()`,
      [key, botId, JSON.stringify(data)]
    );
  },

  deleteChatSession: async (key) => {
    await pool.query(`DELETE FROM chat_sessions WHERE key = $1`, [key]);
  },

  cleanupChatSessions: async (ttlHours = 12) => {
    await pool.query(`DELETE FROM chat_sessions WHERE last_seen < now() - ($1 || ' hours')::interval`, [ttlHours]);
  },

  /* ---------- analytics events ---------- */
  logEvent: async (botId, channel, sessionKey, outCount) => {
    await pool.query(
      `INSERT INTO bot_events (bot_id, channel, session_key, out_count) VALUES ($1, $2, $3, $4)`,
      [botId, channel, sessionKey, outCount]
    );
  },

  analytics: async (botId, days = 30) => {
    const params = [botId, String(days)];
    const totals = await pool.query(
      `SELECT COUNT(*)::int AS messages_in, COALESCE(SUM(out_count),0)::int AS messages_out,
              COUNT(DISTINCT session_key)::int AS conversations
       FROM bot_events WHERE bot_id = $1 AND ts > now() - ($2 || ' days')::interval`,
      params
    );
    const daily = await pool.query(
      `SELECT to_char(date_trunc('day', ts), 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS messages, COUNT(DISTINCT session_key)::int AS conversations
       FROM bot_events WHERE bot_id = $1 AND ts > now() - ($2 || ' days')::interval
       GROUP BY 1 ORDER BY 1`,
      params
    );
    const channels = await pool.query(
      `SELECT channel, COUNT(*)::int AS messages
       FROM bot_events WHERE bot_id = $1 AND ts > now() - ($2 || ' days')::interval
       GROUP BY channel ORDER BY messages DESC`,
      params
    );
    return { totals: totals.rows[0], daily: daily.rows, channels: channels.rows };
  },

  /* ---------- funnel: which blocks conversations actually reach ---------- */
  logNodeEvents: async (botId, sessionKey, nodeIds) => {
    await pool.query(
      `INSERT INTO node_events (bot_id, session_key, node_id)
       SELECT $1, $2, unnest($3::text[])`,
      [botId, sessionKey, nodeIds]
    );
  },

  // ordered block trail of one conversation — powers canvas session replay
  nodeTrail: async (botId, sessionKey) => {
    const r = await pool.query(
      `SELECT node_id, ts FROM node_events WHERE bot_id = $1 AND session_key = $2 ORDER BY id`,
      [botId, sessionKey]
    );
    return r.rows.map((row) => ({ node: row.node_id, ts: row.ts }));
  },

  funnel: async (botId, days = 30) => {
    const params = [botId, String(days)];
    const perNode = await pool.query(
      `SELECT node_id, COUNT(*)::int AS visits, COUNT(DISTINCT session_key)::int AS sessions
       FROM node_events WHERE bot_id = $1 AND ts > now() - ($2 || ' days')::interval
       GROUP BY node_id`,
      params
    );
    const total = await pool.query(
      `SELECT COUNT(DISTINCT session_key)::int AS sessions
       FROM node_events WHERE bot_id = $1 AND ts > now() - ($2 || ' days')::interval`,
      params
    );
    return {
      totalSessions: total.rows[0].sessions,
      nodes: Object.fromEntries(perNode.rows.map((r) => [r.node_id, { sessions: r.sessions, visits: r.visits }])),
    };
  },

  /* ---------- inbox: message history + human takeover ---------- */
  // rows = [[direction, body], ...] — one INSERT so ids preserve message order
  logChatMessages: async (botId, sessionKey, channel, rows) => {
    if (!rows.length) return;
    await pool.query(
      `INSERT INTO chat_messages (bot_id, session_key, channel, direction, body)
       SELECT $1, $2, $3, unnest($4::text[]), unnest($5::text[])`,
      [botId, sessionKey, channel, rows.map((r) => r[0]), rows.map((r) => String(r[1]).slice(0, 4000))]
    );
  },

  inboxList: async (botId, limit = 50) => {
    const { rows } = await pool.query(
      `SELECT c.session_key, c.messages, m.channel, m.direction AS last_direction,
              m.body AS last_body, m.ts AS last_ts,
              COALESCE((s.data->>'agentMode')::boolean, false) AS agent_mode
       FROM (
         SELECT session_key, MAX(id) AS last_id, COUNT(*)::int AS messages
         FROM chat_messages WHERE bot_id = $1
         GROUP BY session_key ORDER BY MAX(id) DESC LIMIT $2
       ) c
       JOIN chat_messages m ON m.id = c.last_id
       LEFT JOIN chat_sessions s ON s.key = c.session_key`,
      [botId, limit]
    );
    return rows.map((r) => ({
      key: r.session_key,
      channel: r.channel,
      messages: r.messages,
      lastDirection: r.last_direction,
      lastBody: r.last_body,
      lastTs: r.last_ts,
      agentMode: r.agent_mode,
    }));
  },

  // full message history of the N most recent conversations, oldest-first —
  // powers Time Machine replay (draft flow vs what really happened)
  recentThreads: async (botId, sessions = 20) => {
    const { rows } = await pool.query(
      `SELECT session_key, direction, body FROM chat_messages
       WHERE bot_id = $1 AND session_key IN (
         SELECT session_key FROM chat_messages WHERE bot_id = $1
         GROUP BY session_key ORDER BY MAX(id) DESC LIMIT $2
       ) ORDER BY id`,
      [botId, sessions]
    );
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.session_key)) map.set(r.session_key, []);
      map.get(r.session_key).push({ direction: r.direction, body: r.body });
    }
    return map;
  },

  inboxThread: async (botId, sessionKey, limit = 200) => {
    const { rows } = await pool.query(
      `SELECT id, channel, direction, body, ts FROM chat_messages
       WHERE bot_id = $1 AND session_key = $2 ORDER BY id DESC LIMIT $3`,
      [botId, sessionKey, limit]
    );
    const session = await pool.query(`SELECT data FROM chat_sessions WHERE key = $1`, [sessionKey]);
    const data = session.rows[0]?.data || {};
    return {
      messages: rows.reverse(),
      agentMode: data.agentMode === true,
      channel: rows.length ? rows[rows.length - 1].channel : data.channel || "",
    };
  },

  // read without bumping last_seen — widget polling must not keep sessions alive
  peekChatSession: async (key) => {
    const { rows } = await pool.query(`SELECT data FROM chat_sessions WHERE key = $1`, [key]);
    return rows[0] ? rows[0].data : null;
  },

  setAgentMode: async (key, botId, on) => {
    const existing = await pool.query(`SELECT data FROM chat_sessions WHERE key = $1`, [key]);
    const data = existing.rows[0]?.data || { state: null, vars: {} };
    data.agentMode = !!on;
    await pool.query(
      `INSERT INTO chat_sessions (key, bot_id, data, last_seen) VALUES ($1, $2, $3, now())
       ON CONFLICT (key) DO UPDATE SET data = $3, last_seen = now()`,
      [key, botId, JSON.stringify(data)]
    );
    return data;
  },

  agentMessagesAfter: async (botId, sessionKey, afterId) => {
    if (afterId == null) {
      const { rows } = await pool.query(
        `SELECT COALESCE(MAX(id), 0)::bigint AS last FROM chat_messages
         WHERE bot_id = $1 AND session_key = $2 AND direction = 'agent'`,
        [botId, sessionKey]
      );
      return { last: Number(rows[0].last), messages: [] };
    }
    const { rows } = await pool.query(
      `SELECT id, body FROM chat_messages
       WHERE bot_id = $1 AND session_key = $2 AND direction = 'agent' AND id > $3
       ORDER BY id LIMIT 50`,
      [botId, sessionKey, afterId]
    );
    const last = rows.length ? Number(rows[rows.length - 1].id) : Number(afterId);
    return { last, messages: rows.map((r) => ({ id: Number(r.id), body: r.body })) };
  },

  cleanupChatMessages: async (days = 30) => {
    await pool.query(`DELETE FROM chat_messages WHERE ts < now() - ($1 || ' days')::interval`, [String(days)]);
    await pool.query(`DELETE FROM node_events WHERE ts < now() - ($1 || ' days')::interval`, [String(days)]);
  },

  /* ---------- broadcasts ---------- */
  // everyone who ever messaged this bot on the given channel; the session_key
  // suffix after "botId|" is the provider address we can push back to
  broadcastContacts: async (botId, channel, cap = 500) => {
    const { rows } = await pool.query(
      `SELECT DISTINCT session_key FROM bot_events
       WHERE bot_id = $1 AND channel = $2 AND session_key IS NOT NULL
       ORDER BY session_key LIMIT $3`,
      [botId, channel, cap]
    );
    return rows.map((r) => r.session_key.slice(botId.length + 1)).filter(Boolean);
  },

  createBroadcast: async (b) => {
    const { rows } = await pool.query(
      `INSERT INTO broadcasts (id, bot_id, message, total) VALUES ($1, $2, $3, $4) RETURNING *`,
      [b.id, b.botId, b.message, b.total]
    );
    return rows[0];
  },

  listBroadcasts: async (botId, limit = 20) => {
    const { rows } = await pool.query(
      `SELECT id, message, status, total, sent_count, fail_count, created_at
       FROM broadcasts WHERE bot_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [botId, limit]
    );
    return rows;
  },

  // claim due broadcasts atomically so overlapping ticks never double-send
  claimDueBroadcasts: async () => {
    const { rows } = await pool.query(
      `UPDATE broadcasts SET status = 'sending' WHERE id IN (
         SELECT id FROM broadcasts WHERE status = 'queued' AND send_at <= now() LIMIT 3
       ) RETURNING *`
    );
    return rows;
  },

  finishBroadcast: async (id, { status, sent, failed }) => {
    await pool.query(
      `UPDATE broadcasts SET status = $2, sent_count = $3, fail_count = $4 WHERE id = $1`,
      [id, status, sent, failed]
    );
  },

  /* ---------- custom feature blocks (Block Lab) ---------- */
  listBlocks: async (userId) => {
    const { rows } = await pool.query(
      `SELECT id, name, icon, color, descr, steps FROM custom_blocks WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    return rows;
  },

  getBlock: async (id, userId) => {
    const { rows } = await pool.query(
      `SELECT id, name, icon, color, descr, steps FROM custom_blocks WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  },

  upsertBlock: async (b) => {
    const { rows } = await pool.query(
      `INSERT INTO custom_blocks (id, user_id, name, icon, color, descr, steps, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (id) DO UPDATE SET
         name = $3, icon = $4, color = $5, descr = $6, steps = $7, updated_at = now()
       WHERE custom_blocks.user_id = $2
       RETURNING id, name, icon, color, descr, steps`,
      [b.id, b.userId, b.name, b.icon, b.color, b.descr, JSON.stringify(b.steps)]
    );
    return rows[0] || null;
  },

  removeBlock: async (id, userId) => {
    await pool.query(`DELETE FROM custom_blocks WHERE id = $1 AND user_id = $2`, [id, userId]);
  },
};
