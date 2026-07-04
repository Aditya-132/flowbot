import { useState } from "react";
import { api, setToken } from "./api.js";

/* ============================================================
   Auth — login / signup. Renders as a full page, or as a modal
   (modal + onClose props) when a guest hits a login-only action:
   saving a bot, saving a custom block, exporting code, activating.
   On success stores the bearer token and hands the user up.
   ============================================================ */

export default function AuthPage({ onAuth, modal = false, onClose }) {
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
    <div style={{ ...S.page, ...(modal ? S.pageModal : {}) }} onClick={modal ? onClose : undefined}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={S.logo}>⚡</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>FlowBot — WhatsApp Bot Builder</h1>
            <div style={{ fontSize: 11, color: "#64748b" }}>drag & drop flowchart → live WhatsApp bot · no code, no AI</div>
          </div>
          {modal && <button style={S.closeBtn} onClick={onClose} title="Keep building without an account">✕</button>}
        </div>
        {modal && (
          <div style={S.modalNote}>
            🔐 Create a free account (or log in) to save this bot, make custom blocks, export code and go live.
            Your canvas stays exactly as it is.
          </div>
        )}
        <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.55 }}>
          39+ ready blocks, hotel/restaurant/bank/store templates, a Block Lab to invent your own
          blocks, a live simulator — go live on Meta, Twilio, Green API or Whapi, or export your
          bot's full code as a ZIP.
        </p>

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

        <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 4 }}>
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
  page: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef2f9", color: "#0f172a", fontFamily: "'Sora','Segoe UI',system-ui,sans-serif", backgroundImage: "radial-gradient(#c6d3e8 1.2px, transparent 1.2px)", backgroundSize: "22px 22px" },
  pageModal: { position: "fixed", inset: 0, zIndex: 96, height: "auto", background: "rgba(15,23,42,.5)", backgroundImage: "none" },
  closeBtn: { border: "1px solid #dbe3ee", background: "#ffffff", color: "#64748b", borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", fontSize: 13 },
  modalNote: { fontSize: 12, color: "#047857", background: "#ecfdf5", border: "1px solid #34d399", borderRadius: 10, padding: "9px 12px", lineHeight: 1.5 },
  card: { width: 360, maxWidth: "92vw", maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 26, boxShadow: "0 20px 50px rgba(15,23,42,.18)" },
  logo: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 14px #25d36655" },
  tabs: { display: "flex", gap: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  tabActive: { background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#ffffff", boxShadow: "0 3px 10px rgba(18,140,126,.3)" },
  label: { display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 700, color: "#0f766e" },
  input: { boxSizing: "border-box", padding: "9px 11px", borderRadius: 8, border: "1px solid #d6dee9", background: "#ffffff", color: "#0f172a", fontSize: 16, outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 400 },
  error: { padding: "8px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #ef4444", color: "#b91c1c", fontSize: 12.5, fontWeight: 700 },
  primaryBtn: { padding: "11px 18px", fontSize: 14, fontWeight: 800, borderRadius: 9, border: "none", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#ffffff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(18,140,126,.3)" },
  linkBtn: { border: "none", background: "transparent", color: "#128C7E", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline" },
};
