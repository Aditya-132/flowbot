import { useState } from "react";
import { api, setToken } from "./api.js";

/* ============================================================
   Auth page — login / signup. On success stores the bearer
   token and hands the user object up to the app shell.
   ============================================================ */

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await api.signup({ name, email, password })
          : await api.login({ email, password });
      setToken(res.token);
      onAuth(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(null); };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={S.logo}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>FlowBot</div>
            <div style={{ fontSize: 11, color: "#8fae9d" }}>flowchart → WhatsApp bot · no-AI runtime</div>
          </div>
        </div>

        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(mode === "login" ? S.tabActive : {}) }} onClick={() => switchMode("login")}>
            Log in
          </button>
          <button style={{ ...S.tab, ...(mode === "signup" ? S.tabActive : {}) }} onClick={() => switchMode("signup")}>
            Sign up
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <label style={S.label}>
              Name
              <input style={S.input} value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" autoComplete="name" />
            </label>
          )}
          <label style={S.label}>
            Email
            <input style={S.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" />
          </label>
          <label style={S.label}>
            Password
            <input style={S.input} type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </label>

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" style={{ ...S.primaryBtn, opacity: busy ? 0.6 : 1 }} disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <div style={{ fontSize: 12, color: "#8fae9d", textAlign: "center", marginTop: 4 }}>
          {mode === "login" ? (
            <>New here?{" "}
              <button style={S.linkBtn} onClick={() => switchMode("signup")}>Create an account</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button style={S.linkBtn} onClick={() => switchMode("login")}>Log in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a120d", color: "#e6f4ec", fontFamily: "'Sora','Segoe UI',system-ui,sans-serif", backgroundImage: "radial-gradient(#1a2f22 1.2px, transparent 1.2px)", backgroundSize: "22px 22px" },
  card: { width: 360, maxWidth: "92vw", display: "flex", flexDirection: "column", gap: 16, background: "#0c1610", border: "1px solid #16281e", borderRadius: 16, padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,.5)" },
  logo: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 18px #25d36644" },
  tabs: { display: "flex", gap: 6, background: "#0a120d", border: "1px solid #1d3328", borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "transparent", color: "#8fae9d", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  tabActive: { background: "#25D366", color: "#06130b" },
  label: { display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 700, color: "#9be8c0" },
  input: { boxSizing: "border-box", padding: "9px 11px", borderRadius: 8, border: "1px solid #2a4535", background: "#0a120d", color: "#e6f4ec", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 400 },
  error: { padding: "8px 12px", borderRadius: 8, background: "#3a1414", border: "1px solid #FF7A7A", color: "#ffb3b3", fontSize: 12.5, fontWeight: 700 },
  primaryBtn: { padding: "11px 18px", fontSize: 14, fontWeight: 800, borderRadius: 9, border: "none", background: "#25D366", color: "#06130b", cursor: "pointer", fontFamily: "inherit" },
  linkBtn: { border: "none", background: "transparent", color: "#25D366", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline" },
};
