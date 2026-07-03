// ============================================================
// Auth: signup/login with scrypt password hashing (no new deps)
// and opaque bearer tokens stored in the sessions table.
// ============================================================

const crypto = require("crypto");
const store = require("./store");

const SESSION_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- password hashing (crypto.scrypt, salt:hash hex) ---------- */
const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(`${salt}:${derived.toString("hex")}`);
    });
  });

const verifyPassword = (password, stored) =>
  new Promise((resolve, reject) => {
    const [salt, hash] = String(stored || "").split(":");
    if (!salt || !hash) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      const expected = Buffer.from(hash, "hex");
      resolve(expected.length === derived.length && crypto.timingSafeEqual(expected, derived));
    });
  });

/* ---------- sessions ---------- */
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await store.pool.query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  );
  return token;
}

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name });

/* ---------- middleware: attaches req.user or replies 401 ---------- */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "login required" });
    const { rows } = await store.pool.query(
      `SELECT u.id, u.email, u.name FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    );
    if (!rows[0]) return res.status(401).json({ error: "session expired, please log in again" });
    req.user = rows[0];
    req.token = token;
    next();
  } catch (e) {
    next(e);
  }
}

/* ---------- route handlers ---------- */
async function signup(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const name = String(req.body.name || "").trim().slice(0, 60);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "valid email required" });
  if (password.length < 6) return res.status(400).json({ error: "password must be at least 6 characters" });

  const existing = await store.pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
  if (existing.rows[0]) return res.status(409).json({ error: "an account with this email already exists" });

  const id = crypto.randomBytes(6).toString("hex");
  const passwordHash = await hashPassword(password);
  const { rows } = await store.pool.query(
    `INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)
     RETURNING id, email, name`,
    [id, email, name || email.split("@")[0], passwordHash]
  );
  const token = await createSession(id);
  res.status(201).json({ token, user: publicUser(rows[0]) });
}

async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const { rows } = await store.pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  const user = rows[0];
  // verify even when the user is missing so response timing doesn't leak which emails exist
  const ok = await verifyPassword(password, user ? user.password_hash : "x:00");
  if (!user || !ok) return res.status(401).json({ error: "invalid email or password" });
  const token = await createSession(user.id);
  res.json({ token, user: publicUser(user) });
}

async function logout(req, res) {
  await store.pool.query(`DELETE FROM sessions WHERE token = $1`, [req.token]);
  res.json({ ok: true });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { requireAuth, signup, login, logout, me };
