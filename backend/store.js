// ============================================================
// Postgres persistence layer for bot flows.
// Same interface as before (list/get/upsert/remove) — now async.
// Table is auto-created on startup.
// ============================================================

const { Pool } = require("pg");

// trim(): stray whitespace around a pasted URL makes pg dial its internal
// dummy host ("base") instead of erroring — see pg-connection-string parse().
const DB_URL = (
  process.env.DATABASE_URL || "postgres://flowbot:flowbot@localhost:5432/flowbot"
).trim();

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
      provider   TEXT NOT NULL DEFAULT 'twilio',
      active     BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // migrations for databases created before newer provider adapters existed
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS meta JSONB;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS green JSONB;`);
  await pool.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS whapi JSONB;`);
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
      `INSERT INTO flows (id, name, nodes, edges, twilio, meta, green, whapi, provider, active, user_id, updated_at)
       VALUES ($1, COALESCE($2, 'Untitled bot'), COALESCE($3, '[]'::jsonb),
               COALESCE($4, '[]'::jsonb), $5, $6, $7, $8, COALESCE($9, 'twilio'), COALESCE($10, false), $11, now())
       ON CONFLICT (id) DO UPDATE SET
         name       = COALESCE($2, flows.name),
         nodes      = COALESCE($3, flows.nodes),
         edges      = COALESCE($4, flows.edges),
         twilio     = COALESCE($5, flows.twilio),
         meta       = COALESCE($6, flows.meta),
         green      = COALESCE($7, flows.green),
         whapi      = COALESCE($8, flows.whapi),
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
