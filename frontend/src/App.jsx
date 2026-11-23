      ))}
    </>
  );
}
function longField(key, value) {
  return /message|question|description|caption|note|policy|ack|notFound|thanks/i.test(key) || String(value || "").length > 54;
}
function ArrayEditor({ value, onChange }) {
  const isObjectList = value.some((item) => item && typeof item === "object" && !Array.isArray(item));
  const updateItem = (idx, next) => onChange(value.map((item, i) => (i === idx ? next : item)));
  const removeItem = (idx) => onChange(value.filter((_, i) => i !== idx));
  const addItem = () => {
    if (isObjectList) {
      const template = value[0] || { name: "New item", price: "" };
      onChange([...value, Object.fromEntries(Object.keys(template).map((k) => [k, k === "name" ? "New item" : ""]))]);
    } else {
      onChange([...value, "New option"]);
    }
  };
  return (
    <div>
      {value.map((item, idx) => (
        <div key={idx} style={{ marginBottom: 8, padding: 8, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          {isObjectList ? Object.entries(item).map(([k, v]) => (
            <input key={k} style={{ ...styles.input, marginBottom: 6 }} placeholder={k} value={v}
              onChange={(e) => updateItem(idx, { ...item, [k]: e.target.value })} />
          )) : (
            <input style={styles.input} value={item} onChange={(e) => updateItem(idx, e.target.value)} />
          )}
          {value.length > 1 && <button style={{ ...styles.miniBtn, marginTop: 4 }} onClick={() => removeItem(idx)}>✕ remove</button>}
        </div>
      ))}
      <button style={styles.addBtn} onClick={addItem}>+ Add</button>
    </div>
  );
}

/* ---------- demo flow ---------- */
function demoNodes() {
  return [
    { id: "n1", type: "welcome", x: 40, y: 120, config: NODE_TYPES.welcome.defaults() },
    { id: "n2", type: "menu", x: 320, y: 100, config: NODE_TYPES.menu.defaults() },
    { id: "n3", type: "faq", x: 620, y: 30, config: NODE_TYPES.faq.defaults() },
    { id: "n4", type: "collect", x: 620, y: 200, config: NODE_TYPES.collect.defaults() },
    { id: "n5", type: "goodbye", x: 900, y: 200, config: NODE_TYPES.goodbye.defaults() },
  ];
}
function demoEdges() {
  return [
    { id: "e1", from: "n1", fromPort: 0, to: "n2" },
    { id: "e2", from: "n2", fromPort: 0, to: "n3" },
    { id: "e3", from: "n2", fromPort: 1, to: "n4" },
    { id: "e4", from: "n2", fromPort: 2, to: "n5" },
    { id: "e5", from: "n4", fromPort: 0, to: "n5" },
    { id: "e6", from: "n3", fromPort: 0, to: "n5" },
  ];
}

/* ---------- styles (light + colorful) ---------- */
const mono = "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace";
const styles = {
  app: { height: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(160deg,#eef2f9 0%,#e8f4ee 100%)", color: "#0f172a", fontFamily: "'Sora','Segoe UI',system-ui,sans-serif", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "10px 16px", borderBottom: "1px solid rgba(226,232,240,.9)", background: "rgba(255,255,255,.92)", backdropFilter: "blur(10px)", boxShadow: "0 2px 20px rgba(15,23,42,.07)" },
  logo: { width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: "0 6px 20px #25d36666, inset 0 1px 0 rgba(255,255,255,.35)" },
  tab: { padding: "8px 15px", borderRadius: 999, border: "1px solid #dbe3ee", background: "#ffffff", color: "#64748b", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  tabActive: { background: "linear-gradient(135deg,#25D366,#128C7E)", borderColor: "transparent", color: "#ffffff", boxShadow: "0 5px 16px rgba(18,140,126,.4)" },
  toast: { position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 99, padding: "8px 18px", borderRadius: 10, border: "1px solid", fontSize: 13, fontWeight: 700, boxShadow: "0 10px 30px rgba(15,23,42,.15)" },
  overlay: { position: "fixed", inset: 0, zIndex: 90, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  labCard: { width: 560, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, boxShadow: "0 24px 60px rgba(15,23,42,.25)" },

  designWrap: { flex: 1, display: "flex", minHeight: 0 },
  palette: { width: 230, padding: 14, borderRight: "1px solid #e2e8f0", overflowY: "auto", background: "#ffffff", flexShrink: 0 },
  paneTitle: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#0f766e", marginBottom: 8 },
  paletteItem: { display: "flex", gap: 10, alignItems: "flex-start", width: "100%", textAlign: "left", padding: 10, marginBottom: 8, borderRadius: 11, border: "1px solid #e5eaf2", background: "linear-gradient(180deg,#ffffff,#f8fafc)", cursor: "pointer", color: "inherit", fontFamily: "inherit", boxShadow: "0 1px 3px rgba(15,23,42,.04)" },
  tipBox: { marginTop: 10, padding: 10, fontSize: 11, color: "#64748b", background: "#f0fdf4", border: "1px dashed #86d5ac", borderRadius: 10, lineHeight: 1.5 },

  // canvas pans with touch; nodes set touchAction:none so dragging them doesn't scroll
  canvas: { flex: 1, position: "relative", overflow: "auto", backgroundImage: "radial-gradient(#c6d3e8 1.2px, transparent 1.2px)", backgroundSize: "22px 22px", backgroundColor: "#f1f5fb", touchAction: "pan-x pan-y", WebkitOverflowScrolling: "touch" },
  svg: { position: "absolute", top: 0, left: 0, pointerEvents: "none" },

  node: { position: "absolute", width: NODE_W, background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 13, boxShadow: "0 4px 16px rgba(15,23,42,.07)", userSelect: "none", touchAction: "none" },
  nodeHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", fontSize: 12, fontWeight: 800, borderRadius: "10px 10px 0 0", cursor: "grab" },
  entryBadge: { fontSize: 9, fontWeight: 800, background: "#25D366", color: "#ffffff", padding: "1px 6px", borderRadius: 6 },
  nodeBody: { padding: "8px 10px" },
  menuRow: { fontSize: 11, color: "#334155", background: "#f1f5f9", borderRadius: 6, padding: "3px 8px", marginTop: 5 },
  chip: { display: "inline-block", marginTop: 6, fontSize: 10, fontFamily: mono, color: "#7c3aed", background: "#7c3aed14", padding: "2px 8px", borderRadius: 6 },
  port: { position: "absolute", width: 14, height: 14, borderRadius: "50%", border: "2.5px solid #ffffff", cursor: "crosshair", zIndex: 5 },
  warnFloat: { position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "#fff7ed", border: "1px solid #f59e0b", color: "#b45309", fontSize: 12, padding: "6px 14px", borderRadius: 8, boxShadow: "0 6px 20px rgba(15,23,42,.12)" },

  inspector: { width: 260, padding: 14, borderLeft: "1px solid #e2e8f0", overflowY: "auto", background: "#ffffff", flexShrink: 0 },

  /* mobile: palette slides in from the left, inspector rises as a bottom sheet */
  paletteDrawer: { position: "fixed", top: 0, left: 0, bottom: 0, width: "min(320px, 85vw)", zIndex: 70, borderRight: "1px solid #e2e8f0", boxShadow: "12px 0 40px rgba(15,23,42,.2)" },
  drawerBackdrop: { position: "fixed", inset: 0, zIndex: 65, background: "rgba(15,23,42,.4)" },
  inspectorSheet: { position: "fixed", left: 0, right: 0, bottom: 0, width: "auto", maxHeight: "58vh", zIndex: 60, borderLeft: "none", borderTop: "1px solid #e2e8f0", borderRadius: "16px 16px 0 0", boxShadow: "0 -12px 40px rgba(15,23,42,.2)" },
  fab: { position: "fixed", bottom: 16, left: 16, zIndex: 40, padding: "12px 18px", fontSize: 14, fontWeight: 800, borderRadius: 999, border: "none", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#ffffff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(18,140,126,.4)" },
  input: { boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #d6dee9", background: "#ffffff", color: "#0f172a", fontSize: 12.5, outline: "none", fontFamily: "inherit", width: "100%" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #d6dee9", background: "#ffffff", color: "#0f172a", fontSize: 12.5, outline: "none", resize: "vertical", fontFamily: "inherit" },
  miniBtn: { padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #dbe3ee", background: "#ffffff", color: "#64748b", cursor: "pointer", fontFamily: "inherit" },
  addBtn: { width: "100%", padding: "7px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px dashed #059669", background: "transparent", color: "#059669", cursor: "pointer", fontFamily: "inherit" },
  dangerBtn: { width: "100%", marginTop: 8, padding: "8px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px solid #fecdd3", background: "#fff1f2", color: "#e11d48", cursor: "pointer", fontFamily: "inherit" },
  primaryBtn: { padding: "9px 18px", fontSize: 13, fontWeight: 800, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#2ce07a 0%,#25D366 45%,#128C7E 100%)", color: "#ffffff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 18px rgba(18,140,126,.38), inset 0 1px 0 rgba(255,255,255,.28)" },
  ghostBtn: { padding: "8px 14px", fontSize: 12.5, fontWeight: 700, borderRadius: 9, border: "1px solid #c8e6d5", background: "#f0fdf4", color: "#0f766e", cursor: "pointer", fontFamily: "inherit" },

  codeWrap: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 16, gap: 10 },
  codeBar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  warnBar: { padding: "8px 12px", borderRadius: 8, background: "#fff7ed", border: "1px solid #f59e0b", color: "#b45309", fontSize: 12 },
  codeBox: { flex: 1, margin: 0, overflow: "auto", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, fontSize: 11.5, lineHeight: 1.55, color: "#86efac", fontFamily: mono, whiteSpace: "pre", boxShadow: "0 10px 30px rgba(15,23,42,.15)" },
  inlineCode: { fontFamily: mono, fontSize: 11, background: "#e8eef7", padding: "1px 6px", borderRadius: 5, color: "#0f766e" },

  activateWrap: { flex: 1, display: "flex", gap: 18, padding: 18, overflow: "auto", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" },
  credCard: { width: 360, maxWidth: "100%", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, boxShadow: "0 14px 40px rgba(15,23,42,.09)" },
  liveBox: { marginTop: 14, padding: 12, borderRadius: 12, background: "linear-gradient(160deg,#ecfdf5,#f0fdf9)", border: "1px solid #34d399", boxShadow: "0 6px 20px rgba(52,211,153,.15)" },
  liveBadge: { fontSize: 9.5, fontWeight: 800, letterSpacing: 1, color: "#ffffff", background: "linear-gradient(135deg,#22c55e,#059669)", padding: "2px 8px", borderRadius: 999, boxShadow: "0 0 0 3px rgba(34,197,94,.18)", animation: "none" },

  phone: { width: 340, maxWidth: "100%", height: "min(560px, calc(100dvh - 180px))", minHeight: 380, display: "flex", flexDirection: "column", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 50px rgba(15,23,42,.18)" },
  phoneHeader: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "linear-gradient(135deg,#128C7E,#25D366)", color: "#ffffff" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  phoneBody: { flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 7, backgroundColor: "#efeae2", backgroundImage: "radial-gradient(#dcd3c3 1px, transparent 1px)", backgroundSize: "16px 16px" },
  bubble: { maxWidth: "80%", padding: "8px 11px", borderRadius: 12, fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  bubbleBot: { background: "#ffffff", border: "1px solid #e5decf", borderTopLeftRadius: 3 },
  bubbleMe: { background: "#d9fdd3", color: "#0b3d2c", borderTopRightRadius: 3 },
  phoneInput: { display: "flex", gap: 8, padding: 10, borderTop: "1px solid #e2e8f0", background: "#f8fafc" },

  /* AI Builder side panel */
  aiPanel: { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(370px, 100vw)", zIndex: 85, display: "flex", flexDirection: "column", background: "#ffffff", borderLeft: "1px solid #e2e8f0", boxShadow: "-12px 0 40px rgba(15,23,42,.18)" },
  aiHeader: { display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#ffffff" },
  aiSettings: { padding: "10px 12px", borderBottom: "1px solid #e2e8f0", background: "#faf5ff" },
