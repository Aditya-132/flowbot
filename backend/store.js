// ============================================================
// Postgres persistence layer for bot flows.
// Same interface as before (list/get/upsert/remove) — now async.
// Table is auto-created on startup.
// ============================================================

const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://flowbot:flowbot@localhost:5432/flowbot",
});

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
  };

module.exports = {
  init,
  pool,

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
