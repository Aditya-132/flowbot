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
    updatedAt: r.updated_at,
  };

module.exports = {
  init,
  pool,

  list: async () => {
    const { rows } = await pool.query(
      `SELECT id, name, active, updated_at, jsonb_array_length(nodes) AS blocks
       FROM flows ORDER BY updated_at DESC`
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
      `INSERT INTO flows (id, name, nodes, edges, twilio, meta, green, whapi, provider, active, updated_at)
       VALUES ($1, COALESCE($2, 'Untitled bot'), COALESCE($3, '[]'::jsonb),
               COALESCE($4, '[]'::jsonb), $5, $6, $7, $8, COALESCE($9, 'twilio'), COALESCE($10, false), now())
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
      ]
    );
    return rowToFlow(rows[0]);
  },

  remove: async (id) => {
    await pool.query(`DELETE FROM flows WHERE id = $1`, [id]);
  },
};
