import { useState, useRef, useEffect } from "react";
import { api } from "./api.js";

/* ============================================================
   FlowBot — WhatsApp Bot Builder (full-stack)
   Design a flowchart → backend stores it → deterministic code
   export → activate with provider creds → live webhook + simulator.
   5 pre-embedded features. NO AI in the bot runtime.
   ============================================================ */

const NODE_W = 220;

const NODE_TYPES = {
  welcome: {
    label: "Welcome Message", icon: "👋", color: "#25D366",
    desc: "Entry point. Greets the customer on their first message.",
    defaults: () => ({ message: "👋 Hi! Welcome to QuickKart. I'm your assistant bot." }),
  },
  menu: {
    label: "Menu Options", icon: "🔢", color: "#F5B841",
    desc: "Numbered menu. Each option branches to another block.",
    defaults: () => ({ prompt: "How can I help you today?", options: ["Browse products", "Order status", "Talk to a human"] }),
  },
  faq: {
    label: "FAQ Auto-Reply", icon: "💬", color: "#4EA8DE",
    desc: "Keyword → answer table. Replies when a keyword matches.",
    defaults: () => ({
      pairs: [
        { k: "price", a: "Our plans start at ₹499/month." },
        { k: "delivery", a: "Delivery takes 2–4 business days." },
      ],
    }),
  },
  collect: {
    label: "Collect Info", icon: "📝", color: "#B983FF",
    desc: "Asks a question and saves the reply into a variable.",
    defaults: () => ({ question: "Please share your name:", field: "name" }),
  },
  goodbye: {
    label: "Goodbye / Handoff", icon: "🤝", color: "#FF7A7A",
    desc: "Ends the conversation. Supports {variables} like {name}.",
    defaults: () => ({ message: "Thanks {name}! Our team will reach out shortly. 🙌" }),
  },
};

/* ---------- geometry ---------- */
const nodeH = (n) => (n.type === "menu" ? 66 + n.config.options.length * 26 + 12 : 90);
const outPortPos = (n, i) =>
  n.type === "menu" ? { x: n.x + NODE_W, y: n.y + 66 + i * 26 + 13 } : { x: n.x + NODE_W, y: n.y + 60 };
const inPortPos = (n) => ({ x: n.x, y: n.y + 18 });
const outputCount = (n) => (n.type === "goodbye" ? 0 : n.type === "menu" ? n.config.options.length : 1);
const bez = (a, b) => {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
};
const uid = () => Math.random().toString(36).slice(2, 9);

export default function App() {
  const [tab, setTab] = useState(0);
  const [botId, setBotId] = useState(null);
  const [botName, setBotName] = useState("My WhatsApp Bot");
  const [nodes, setNodes] = useState(demoNodes);
  const [edges, setEdges] = useState(demoEdges);
  const [dirty, setDirty] = useState(true);
  const [savedFlows, setSavedFlows] = useState([]);
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [provider, setProvider] = useState("meta");
  const [creds, setCreds] = useState({ sid: "", token: "", number: "" });
  const [metaCreds, setMetaCreds] = useState({ accessToken: "", phoneNumberId: "" });
  const [greenCreds, setGreenCreds] = useState({ idInstance: "", apiTokenInstance: "", apiUrl: "https://api.green-api.com" });
  const [whapiCreds, setWhapiCreds] = useState({ token: "", apiUrl: "https://gate.whapi.cloud" });
  const [activation, setActivation] = useState(null); // {webhook, verifyToken?}
  const [activated, setActivated] = useState(false);
  const [code, setCode] = useState("");
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  const hasWelcome = nodes.some((n) => n.type === "welcome");
  const selNode = nodes.find((n) => n.id === sel);

  useEffect(() => { refreshList(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const flash = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2400); };
  const refreshList = () => api.listFlows().then(setSavedFlows).catch(() => {});
  const markDirty = () => setDirty(true);
  const webhookFor = (p, id) =>
    p === "meta" ? `/meta/webhook/${id}` : p === "green" ? `/green/webhook/${id}` : p === "whapi" ? `/whapi/webhook/${id}` : `/whatsapp/${id}`;

  /* ---------- persistence ---------- */
  async function saveFlow() {
    setBusy(true);
    try {
      if (botId) {
        await api.updateFlow(botId, { name: botName, nodes, edges });
      } else {
        const created = await api.createFlow({ name: botName, nodes, edges });
        setBotId(created.id);
      }
      setDirty(false);
      refreshList();
      flash("💾 Flow saved");
      return true;
    } catch (e) {
      flash("Save failed: " + e.message, true);
      return false;
    } finally { setBusy(false); }
  }

  async function ensureSaved() {
    if (!dirty && botId) return true;
    return saveFlow();
  }

  async function loadFlow(id) {
    try {
      const f = await api.getFlow(id);
      setBotId(f.id); setBotName(f.name); setNodes(f.nodes); setEdges(f.edges);
      setActivated(!!f.active);
      setProvider(f.provider || "meta");
      setCreds({ sid: f.twilio?.sid || "", token: "", number: f.twilio?.number || "" });
      setMetaCreds({ accessToken: "", phoneNumberId: f.meta?.phoneNumberId || "" });
      setGreenCreds({
        idInstance: f.green?.idInstance || "",
        apiTokenInstance: "",
        apiUrl: f.green?.apiUrl || "https://api.green-api.com",
      });
      setWhapiCreds({ token: "", apiUrl: f.whapi?.apiUrl || "https://gate.whapi.cloud" });
      setActivation(f.active ? { webhook: webhookFor(f.provider, f.id), verifyToken: f.meta?.verifyToken } : null);
      setDirty(false); setSel(null); setChat([]); setTab(0);
      flash("📂 Loaded: " + f.name);
    } catch (e) { flash("Load failed: " + e.message, true); }
  }

  function newFlow() {
    setBotId(null); setBotName("My WhatsApp Bot");
    setNodes(demoNodes()); setEdges(demoEdges());
    setActivated(false); setCreds({ sid: "", token: "", number: "" });
    setMetaCreds({ accessToken: "", phoneNumberId: "" });
    setGreenCreds({ idInstance: "", apiTokenInstance: "", apiUrl: "https://api.green-api.com" });
    setWhapiCreds({ token: "", apiUrl: "https://gate.whapi.cloud" });
    setActivation(null);
    setDirty(true); setSel(null); setChat([]); setTab(0);
  }

  /* ---------- tab switching (auto-saves before code/activate) ---------- */
  async function goTab(i) {
    if (i > 0) {
      const ok = await ensureSaved();
      if (!ok) return;
      if (i === 1) {
        try { setCode(await api.getCode(botIdRefSafe())); } catch { setCode("// save the flow first"); }
      }
    }
    setTab(i);
  }
  // botId state may not be flushed yet right after create; read latest via list
  function botIdRefSafe() { return botId || (savedFlows[0] && savedFlows[0].id); }

  useEffect(() => {
    if (tab === 1 && botId) api.getCode(botId).then(setCode).catch(() => {});
  }, [tab, botId, dirty]);

  /* ---------- canvas interactions ---------- */
  const canvasXY = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left + canvasRef.current.scrollLeft, y: e.clientY - r.top + canvasRef.current.scrollTop };
  };
  const onCanvasMove = (e) => {
    if (drag) {
      const p = canvasXY(e);
      setNodes((ns) => ns.map((n) => (n.id === drag.id ? { ...n, x: Math.max(0, p.x - drag.dx), y: Math.max(0, p.y - drag.dy) } : n)));
      markDirty();
    } else if (connecting) {
      const p = canvasXY(e);
      setConnecting((c) => ({ ...c, x: p.x, y: p.y }));
    }
  };
  const startDrag = (e, n) => {
    e.stopPropagation();
    const p = canvasXY(e);
    setDrag({ id: n.id, dx: p.x - n.x, dy: p.y - n.y });
    setSel(n.id);
  };
  const startConnect = (e, n, port) => {
    e.stopPropagation();
    const p = outPortPos(n, port);
    setConnecting({ from: n.id, port, x: p.x, y: p.y });
  };
  const finishConnect = (e, target) => {
    e.stopPropagation();
    if (!connecting || connecting.from === target.id) return setConnecting(null);
    setEdges((es) => [
      ...es.filter((x) => !(x.from === connecting.from && x.fromPort === connecting.port)),
      { id: uid(), from: connecting.from, fromPort: connecting.port, to: target.id },
    ]);
    setConnecting(null);
    markDirty();
  };
  const addNode = (type) => {
    const n = { id: uid(), type, x: 80 + Math.random() * 120, y: 60 + Math.random() * 160, config: NODE_TYPES[type].defaults() };
    setNodes((ns) => [...ns, n]); setSel(n.id); markDirty();
  };
  const deleteNode = (id) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id));
    setSel(null); markDirty();
  };
  const updateConfig = (id, patch) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, config: { ...n.config, ...patch } } : n)));
    markDirty();
  };

  /* ---------- activation + simulator (both via backend) ---------- */
  async function activateBot() {
    const ok = await ensureSaved();
    if (!ok) return;
    setBusy(true);
    try {
      const payload =
        provider === "meta"
          ? { provider: "meta", ...metaCreds }
          : provider === "green"
            ? { provider: "green", ...greenCreds }
            : provider === "whapi"
              ? { provider: "whapi", ...whapiCreds }
            : creds;
      const r = await api.activate(botId, payload);
      setActivated(true);
      setActivation({ webhook: r.webhook, verifyToken: r.verifyToken });
      refreshList();
      resetChat();
      flash("🚀 Bot activated — webhook " + r.webhook);
    } catch (e) { flash(e.message, true); }
    finally { setBusy(false); }
  }

  async function resetChat() {
    if (!botId) return;
    await api.simulate(botId, { from: "simulator", reset: true }).catch(() => {});
    setChat([{ side: "bot", text: "Simulator ready — messages run through the backend's live engine." }]);
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || !botId) return;
    setChatInput("");
    setChat((c) => [...c, { side: "me", text }]);
    try {
      const { replies } = await api.simulate(botId, { from: "simulator", message: text });
      setChat((c) => [...c, ...replies.map((t) => ({ side: "bot", text: t }))]);
    } catch (e) { flash(e.message, true); }
  }

  const copyCode = () => {
    const ta = document.createElement("textarea");
    ta.value = code;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); flash("✓ Code copied"); } catch {}
    document.body.removeChild(ta);
  };
  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "server.js";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const S = styles;
  const providerReady =
    provider === "meta"
      ? metaCreds.accessToken && metaCreds.phoneNumberId
      : provider === "green"
        ? greenCreds.idInstance && greenCreds.apiTokenInstance
        : provider === "whapi"
          ? whapiCreds.token
        : creds.sid && creds.token && creds.number;

  return (
    <div style={S.app}>
      {/* ---------- header ---------- */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={S.logo}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>FlowBot</div>
            <div style={{ fontSize: 10.5, color: "#8fae9d" }}>flowchart → WhatsApp bot · no-AI runtime</div>
          </div>
          <input style={{ ...S.input, width: 190 }} value={botName}
            onChange={(e) => { setBotName(e.target.value); markDirty(); }} placeholder="Bot name" />
          <button style={S.ghostBtn} onClick={saveFlow} disabled={busy}>
            {dirty ? "💾 Save*" : "✓ Saved"}
          </button>
          <select style={{ ...S.input, width: 160 }} value=""
            onChange={(e) => e.target.value && loadFlow(e.target.value)}>
            <option value="">📂 Open saved bot…</option>
            {savedFlows.map((f) => (
              <option key={f.id} value={f.id}>{f.name} {f.active ? "· live" : ""}</option>
            ))}
          </select>
          <button style={S.ghostBtn} onClick={newFlow}>+ New</button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["1 · Design flow", "2 · Bot code", "3 · Activate & test"].map((t, i) => (
            <button key={t} onClick={() => goTab(i)} style={{ ...S.tab, ...(tab === i ? S.tabActive : {}) }}>{t}</button>
          ))}
        </div>
      </div>

      {toast && <div style={{ ...S.toast, background: toast.err ? "#3a1414" : "#0d2a1a", borderColor: toast.err ? "#FF7A7A" : "#2fbf71", color: toast.err ? "#ffb3b3" : "#9be8c0" }}>{toast.msg}</div>}

      {/* ============ TAB 1: DESIGN ============ */}
      {tab === 0 && (
        <div style={S.designWrap}>
          <div style={S.palette}>
            <div style={S.paneTitle}>Feature blocks</div>
            <div style={{ fontSize: 11, color: "#7d9c8c", marginBottom: 10 }}>
              5 features, each backed by its own pre-written code template on the server.
            </div>
            {Object.entries(NODE_TYPES).map(([k, t]) => (
              <button key={k} onClick={() => addNode(k)} style={S.paletteItem}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 13, color: t.color }}>{t.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: "#8fae9d", lineHeight: 1.35 }}>{t.desc}</span>
                </span>
              </button>
            ))}
            <div style={S.tipBox}>
              💡 Drag to arrange · click a <b>right dot</b> then a block's <b>left dot</b> to wire · click a wire to delete.
            </div>
          </div>

          <div ref={canvasRef} style={S.canvas} onPointerMove={onCanvasMove}
            onPointerUp={() => setDrag(null)} onClick={() => { setSel(null); setConnecting(null); }}>
            <svg style={S.svg} width="2400" height="1600">
              {edges.map((e) => {
                const a = nodes.find((n) => n.id === e.from);
                const b = nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                return (
                  <path key={e.id} d={bez(outPortPos(a, e.fromPort), inPortPos(b))}
                    stroke="#2fbf71" strokeWidth="2.5" strokeDasharray="7 5" fill="none"
                    style={{ cursor: "pointer", pointerEvents: "stroke" }}
                    onClick={(ev) => { ev.stopPropagation(); setEdges((es) => es.filter((x) => x.id !== e.id)); markDirty(); }}>
                    <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
                  </path>
                );
              })}
              {connecting && (
                <path d={bez(outPortPos(nodes.find((n) => n.id === connecting.from), connecting.port), { x: connecting.x, y: connecting.y })}
                  stroke="#9be8c0" strokeWidth="2" strokeDasharray="4 4" fill="none" />
              )}
            </svg>

            {nodes.map((n) => {
              const t = NODE_TYPES[n.type];
              const selected = sel === n.id;
              return (
                <div key={n.id}
                  style={{ ...S.node, left: n.x, top: n.y, height: nodeH(n), borderColor: selected ? t.color : "#1d3328", boxShadow: selected ? `0 0 0 2px ${t.color}55, 0 10px 24px rgba(0,0,0,.45)` : "0 8px 20px rgba(0,0,0,.35)" }}
                  onClick={(e) => { e.stopPropagation(); setSel(n.id); }}>
                  <div style={{ ...S.nodeHeader, background: t.color + "22", color: t.color }} onPointerDown={(e) => startDrag(e, n)}>
                    <span>{t.icon} {t.label}</span>
                    {n.type === "welcome" && <span style={S.entryBadge}>ENTRY</span>}
                  </div>
                  <div style={S.nodeBody}>
                    {(n.type === "welcome" || n.type === "goodbye") && <Trunc text={n.config.message} />}
                    {n.type === "collect" && (<><Trunc text={n.config.question} /><span style={S.chip}>saves → {"{" + n.config.field + "}"}</span></>)}
                    {n.type === "faq" && <Trunc text={n.config.pairs.length + " keyword repl" + (n.config.pairs.length === 1 ? "y" : "ies") + ": " + n.config.pairs.map((p) => p.k).join(", ")} />}
                    {n.type === "menu" && (<>
                      <Trunc text={n.config.prompt} />
                      {n.config.options.map((o, i) => (
                        <div key={i} style={S.menuRow}>{i + 1}. {o.length > 20 ? o.slice(0, 20) + "…" : o}</div>
                      ))}
                    </>)}
                  </div>
                  {n.type !== "welcome" && (
                    <div style={{ ...S.port, left: -7, top: 11, background: connecting ? "#9be8c0" : "#5c8a72" }}
                      onClick={(e) => finishConnect(e, n)} title="input" />
                  )}
                  {Array.from({ length: outputCount(n) }).map((_, i) => (
                    <div key={i} style={{ ...S.port, right: -7, top: outPortPos(n, i).y - n.y - 7, background: t.color }}
                      onPointerDown={(e) => startConnect(e, n, i)} title="drag out" />
                  ))}
                </div>
              );
            })}
            {!hasWelcome && <div style={S.warnFloat}>⚠️ Add a Welcome block — it's the bot's entry point.</div>}
          </div>

          <div style={S.inspector}>
            <div style={S.paneTitle}>Block settings</div>
            {!selNode && <div style={{ fontSize: 12, color: "#7d9c8c" }}>Select a block on the canvas to edit its text and behavior.</div>}
            {selNode && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: NODE_TYPES[selNode.type].color, marginBottom: 10 }}>
                  {NODE_TYPES[selNode.type].icon} {NODE_TYPES[selNode.type].label}
                </div>

                {(selNode.type === "welcome" || selNode.type === "goodbye") && (
                  <Field label="Message">
                    <textarea style={S.textarea} rows={4} value={selNode.config.message}
                      onChange={(e) => updateConfig(selNode.id, { message: e.target.value })} />
                  </Field>
                )}

                {selNode.type === "collect" && (<>
                  <Field label="Question to ask">
                    <textarea style={S.textarea} rows={3} value={selNode.config.question}
                      onChange={(e) => updateConfig(selNode.id, { question: e.target.value })} />
                  </Field>
                  <Field label="Save reply as variable">
                    <input style={S.input} value={selNode.config.field}
                      onChange={(e) => updateConfig(selNode.id, { field: e.target.value.replace(/\W/g, "") })} />
                  </Field>
                  <div style={{ fontSize: 11, color: "#7d9c8c" }}>Use later as {"{" + selNode.config.field + "}"} in a Goodbye block.</div>
                </>)}

                {selNode.type === "menu" && (<>
                  <Field label="Menu prompt">
                    <textarea style={S.textarea} rows={2} value={selNode.config.prompt}
                      onChange={(e) => updateConfig(selNode.id, { prompt: e.target.value })} />
                  </Field>
                  <Field label="Options (each gets its own output dot)">
                    {selNode.config.options.map((o, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input style={{ ...S.input, flex: 1 }} value={o}
                          onChange={(e) => {
                            const options = [...selNode.config.options];
                            options[i] = e.target.value;
                            updateConfig(selNode.id, { options });
                          }} />
                        <button style={S.miniBtn} onClick={() => {
                          const options = selNode.config.options.filter((_, j) => j !== i);
                          if (!options.length) return;
                          updateConfig(selNode.id, { options });
                          setEdges((es) => es.filter((e2) => !(e2.from === selNode.id && e2.fromPort === i)));
                        }}>✕</button>
                      </div>
                    ))}
                    {selNode.config.options.length < 5 && (
                      <button style={S.addBtn} onClick={() => updateConfig(selNode.id, { options: [...selNode.config.options, "New option"] })}>+ Add option</button>
                    )}
                  </Field>
                </>)}

                {selNode.type === "faq" && (
                  <Field label="Keyword → reply pairs">
                    {selNode.config.pairs.map((p, i) => (
                      <div key={i} style={{ marginBottom: 8, padding: 8, background: "#0d1b13", borderRadius: 8, border: "1px solid #1d3328" }}>
                        <input style={{ ...S.input, marginBottom: 6 }} value={p.k} placeholder="keyword"
                          onChange={(e) => updateConfig(selNode.id, { pairs: selNode.config.pairs.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)) })} />
                        <textarea style={S.textarea} rows={2} value={p.a} placeholder="reply"
                          onChange={(e) => updateConfig(selNode.id, { pairs: selNode.config.pairs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
                        <button style={{ ...S.miniBtn, marginTop: 4 }} onClick={() => {
                          const pairs = selNode.config.pairs.filter((_, j) => j !== i);
                          if (pairs.length) updateConfig(selNode.id, { pairs });
                        }}>✕ remove</button>
                      </div>
                    ))}
                    <button style={S.addBtn} onClick={() => updateConfig(selNode.id, { pairs: [...selNode.config.pairs, { k: "keyword", a: "Answer text" }] })}>+ Add pair</button>
                  </Field>
                )}

                <button style={S.dangerBtn} onClick={() => deleteNode(selNode.id)}>🗑 Delete block</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB 2: CODE ============ */}
      {tab === 1 && (
        <div style={S.codeWrap}>
          <div style={S.codeBar}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Generated bot code — <span style={{ color: "#2fbf71" }}>server.js</span></div>
              <div style={{ fontSize: 11.5, color: "#8fae9d", marginTop: 2 }}>
                Assembled on the server from fixed templates per block + your flow as JSON. Deterministic — zero AI. Runs standalone with just <code style={S.inlineCode}>npm install express</code>.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.ghostBtn} onClick={downloadCode}>⬇ Download server.js</button>
              <button style={S.primaryBtn} onClick={copyCode}>Copy code</button>
            </div>
          </div>
          {!hasWelcome && <div style={S.warnBar}>⚠️ Your flow has no Welcome block, so the bot has no entry point yet.</div>}
          <pre style={S.codeBox}>{code || "// loading…"}</pre>
        </div>
      )}

      {/* ============ TAB 3: ACTIVATE ============ */}
      {tab === 2 && (
        <div style={S.activateWrap}>
          <div style={S.credCard}>
            <div style={S.paneTitle}>Connect a provider</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["meta", "Meta Cloud API"], ["green", "Green API"], ["whapi", "Whapi.cloud"], ["twilio", "Twilio"]].map(([p, label]) => (
                <button key={p} onClick={() => setProvider(p)}
                  style={{ ...S.tab, flex: 1, ...(provider === p ? S.tabActive : {}) }}>{label}</button>
              ))}
            </div>

            {provider === "meta" && (<>
              <div style={{ fontSize: 12, color: "#8fae9d", marginBottom: 12, lineHeight: 1.5 }}>
                From <b>developers.facebook.com</b> → your app → <b>WhatsApp → API Setup</b>. The free test number needs no credit card. The access token is never sent back to the browser.
              </div>
              <Field label="Access Token">
                <input style={S.input} type="password" placeholder="temporary or system-user token" value={metaCreds.accessToken}
                  onChange={(e) => setMetaCreds({ ...metaCreds, accessToken: e.target.value })} />
              </Field>
              <Field label="Phone Number ID">
                <input style={S.input} placeholder="e.g. 123456789012345" value={metaCreds.phoneNumberId}
                  onChange={(e) => setMetaCreds({ ...metaCreds, phoneNumberId: e.target.value })} />
              </Field>
              <button
                style={{ ...S.primaryBtn, width: "100%", opacity: hasWelcome && providerReady && !busy ? 1 : 0.45 }}
                disabled={!(hasWelcome && providerReady) || busy}
                onClick={activateBot}>
                🚀 Activate bot
              </button>
            </>)}

            {provider === "green" && (<>
              <div style={{ fontSize: 12, color: "#8fae9d", marginBottom: 12, lineHeight: 1.5 }}>
                From <b>console.green-api.com</b> → create a developer instance → scan QR with WhatsApp Linked Devices. REST token stays on your backend. Same unofficial-API ban-risk caveat applies.
              </div>
              <Field label="ID Instance">
                <input style={S.input} placeholder="e.g. 1101000001" value={greenCreds.idInstance}
                  onChange={(e) => setGreenCreds({ ...greenCreds, idInstance: e.target.value })} />
              </Field>
              <Field label="API Token Instance">
                <input style={S.input} type="password" placeholder="your Green API token" value={greenCreds.apiTokenInstance}
                  onChange={(e) => setGreenCreds({ ...greenCreds, apiTokenInstance: e.target.value })} />
              </Field>
              <Field label="API URL">
                <input style={S.input} placeholder="https://api.green-api.com" value={greenCreds.apiUrl}
                  onChange={(e) => setGreenCreds({ ...greenCreds, apiUrl: e.target.value })} />
              </Field>
              <button
                style={{ ...S.primaryBtn, width: "100%", opacity: hasWelcome && providerReady && !busy ? 1 : 0.45 }}
                disabled={!(hasWelcome && providerReady) || busy}
                onClick={activateBot}>
                🚀 Activate bot
              </button>
            </>)}

            {provider === "whapi" && (<>
              <div style={{ fontSize: 12, color: "#8fae9d", marginBottom: 12, lineHeight: 1.5 }}>
                From <b>panel.whapi.cloud</b> → create a sandbox/channel → pair by QR → copy API token. Token stays on your backend. Same linked-device ban-risk caveat applies.
              </div>
              <Field label="API Token">
                <input style={S.input} type="password" placeholder="Bearer token from Whapi.cloud" value={whapiCreds.token}
                  onChange={(e) => setWhapiCreds({ ...whapiCreds, token: e.target.value })} />
              </Field>
              <Field label="API URL">
                <input style={S.input} placeholder="https://gate.whapi.cloud" value={whapiCreds.apiUrl}
                  onChange={(e) => setWhapiCreds({ ...whapiCreds, apiUrl: e.target.value })} />
              </Field>
              <button
                style={{ ...S.primaryBtn, width: "100%", opacity: hasWelcome && providerReady && !busy ? 1 : 0.45 }}
                disabled={!(hasWelcome && providerReady) || busy}
                onClick={activateBot}>
                🚀 Activate bot
              </button>
            </>)}

            {provider === "twilio" && (<>
              <div style={{ fontSize: 12, color: "#8fae9d", marginBottom: 12, lineHeight: 1.5 }}>
                From <b>Twilio Console → WhatsApp Sandbox</b>. Stored on your backend; the auth token is never sent back to the browser.
              </div>
              <Field label="Account SID">
                <input style={S.input} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={creds.sid}
                  onChange={(e) => setCreds({ ...creds, sid: e.target.value })} />
              </Field>
              <Field label="Auth Token">
                <input style={S.input} type="password" placeholder="your auth token" value={creds.token}
                  onChange={(e) => setCreds({ ...creds, token: e.target.value })} />
              </Field>
              <Field label="WhatsApp number">
                <input style={S.input} placeholder="whatsapp:+14155238886" value={creds.number}
                  onChange={(e) => setCreds({ ...creds, number: e.target.value })} />
              </Field>
              <button
                style={{ ...S.primaryBtn, width: "100%", opacity: hasWelcome && providerReady && !busy ? 1 : 0.45 }}
                disabled={!(hasWelcome && providerReady) || busy}
                onClick={activateBot}>
                🚀 Activate bot
              </button>
            </>)}

            {activated && botId && (
              <div style={S.liveBox}>
                <div style={{ fontWeight: 800, color: "#2fbf71", marginBottom: 6 }}>● Bot is live on this backend</div>
                <div style={{ fontSize: 12, color: "#b9d6c7", lineHeight: 1.7 }}>
                  {provider === "meta" ? (<>
                    Callback URL (paste in Meta App → WhatsApp → Configuration):
                    <div style={{ ...S.inlineCode, display: "block", padding: 8, margin: "6px 0", wordBreak: "break-all" }}>
                      https://&lt;your-host&gt;/meta/webhook/{botId}
                    </div>
                    Verify token:
                    <div style={{ ...S.inlineCode, display: "block", padding: 8, margin: "6px 0", wordBreak: "break-all" }}>
                      {activation?.verifyToken || "(re-activate to view)"}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      <li>Expose the backend: <code style={S.inlineCode}>ngrok http 3001</code> (Meta needs https).</li>
                      <li>Meta App → WhatsApp → Configuration → Webhook: paste Callback URL + Verify token, click Verify & save.</li>
                      <li>Subscribe to the <b>messages</b> webhook field.</li>
                      <li>API Setup me apna personal number recipient me add karke message bhejo — bot reply karega. 🎉</li>
                    </ol>
                  </>) : provider === "green" ? (<>
                    Webhook URL (paste in Green API instance settings):
                    <div style={{ ...S.inlineCode, display: "block", padding: 8, margin: "6px 0", wordBreak: "break-all" }}>
                      https://&lt;your-host&gt;/green/webhook/{botId}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      <li>Expose the backend: <code style={S.inlineCode}>ngrok http 3001</code>.</li>
                      <li>Green API Console → Instance → Settings: enable incoming webhooks and paste the Webhook URL.</li>
                      <li>Scan QR from your Green API instance, then message the paired WhatsApp number. Done. 🎉</li>
                    </ol>
                  </>) : provider === "whapi" ? (<>
                    Webhook URL (paste in Whapi.cloud channel settings):
                    <div style={{ ...S.inlineCode, display: "block", padding: 8, margin: "6px 0", wordBreak: "break-all" }}>
                      https://&lt;your-host&gt;/whapi/webhook/{botId}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      <li>Expose the backend: <code style={S.inlineCode}>ngrok http 3001</code>.</li>
                      <li>Whapi.cloud Channel Settings → Webhooks: add this URL for <b>messages.post</b>.</li>
                      <li>Pair the channel by QR, then message the paired WhatsApp number. Done. 🎉</li>
                    </ol>
                  </>) : (<>
                    Webhook endpoint:
                    <div style={{ ...S.inlineCode, display: "block", padding: 8, margin: "6px 0", wordBreak: "break-all" }}>
                      POST http://&lt;your-host&gt;:3001/whatsapp/{botId}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                      <li>Expose the backend (e.g. <code style={S.inlineCode}>ngrok http 3001</code>).</li>
                      <li>Paste the URL into Twilio Sandbox → "When a message comes in".</li>
                      <li>Message your sandbox number on WhatsApp — done. 🎉</li>
                    </ol>
                  </>)}
                  <div style={{ marginTop: 6 }}>Or download <b>server.js</b> from tab 2 and host the bot anywhere on its own.</div>
                </div>
              </div>
            )}
          </div>

          {/* phone simulator */}
          <div style={S.phone}>
            <div style={S.phoneHeader}>
              <div style={S.avatar}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{botName}</div>
                <div style={{ fontSize: 10.5, color: activated ? "#9be8c0" : "#8fae9d" }}>
                  {activated ? "online · backend engine" : "activate to test"}
                </div>
              </div>
              <button style={{ ...S.miniBtn, marginLeft: "auto" }} onClick={resetChat}>↺ reset</button>
            </div>
            <div style={S.phoneBody}>
              {chat.length === 0 && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#7d9c8c", marginTop: 60 }}>
                  The simulator hits <b>the same backend engine</b><br />that serves the real provider webhook.
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.side === "me" ? "flex-end" : "flex-start" }}>
                  <div style={{ ...S.bubble, ...(m.side === "me" ? S.bubbleMe : S.bubbleBot) }}>{m.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={S.phoneInput}>
              <input style={{ ...S.input, flex: 1, borderRadius: 20 }}
                placeholder={activated ? "Type a message…" : "Activate the bot first"}
                disabled={!activated} value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()} />
              <button style={{ ...S.primaryBtn, borderRadius: 20, padding: "8px 16px" }} disabled={!activated} onClick={sendChat}>➤</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small components ---------- */
function Trunc({ text }) {
  return <div style={{ fontSize: 11.5, color: "#b9d6c7", lineHeight: 1.4 }}>{text.length > 62 ? text.slice(0, 62) + "…" : text}</div>;
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8fae9d", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>{label}</div>
      {children}
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

/* ---------- styles ---------- */
const mono = "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace";
const styles = {
  app: { height: "100vh", display: "flex", flexDirection: "column", background: "#0a120d", color: "#e6f4ec", fontFamily: "'Sora','Segoe UI',system-ui,sans-serif", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "10px 16px", borderBottom: "1px solid #16281e", background: "#0c1610" },
  logo: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 18px #25d36644" },
  tab: { padding: "8px 14px", borderRadius: 8, border: "1px solid #1d3328", background: "transparent", color: "#8fae9d", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  tabActive: { background: "#25D366", borderColor: "#25D366", color: "#06130b" },
  toast: { position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 99, padding: "8px 18px", borderRadius: 10, border: "1px solid", fontSize: 13, fontWeight: 700 },

  designWrap: { flex: 1, display: "flex", minHeight: 0 },
  palette: { width: 230, padding: 14, borderRight: "1px solid #16281e", overflowY: "auto", background: "#0c1610", flexShrink: 0 },
  paneTitle: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#9be8c0", marginBottom: 8 },
  paletteItem: { display: "flex", gap: 10, alignItems: "flex-start", width: "100%", textAlign: "left", padding: 10, marginBottom: 8, borderRadius: 10, border: "1px solid #1d3328", background: "#0d1b13", cursor: "pointer", color: "inherit", fontFamily: "inherit" },
  tipBox: { marginTop: 10, padding: 10, fontSize: 11, color: "#8fae9d", background: "#0d1b13", border: "1px dashed #2a4535", borderRadius: 10, lineHeight: 1.5 },

  canvas: { flex: 1, position: "relative", overflow: "auto", backgroundImage: "radial-gradient(#1a2f22 1.2px, transparent 1.2px)", backgroundSize: "22px 22px", backgroundColor: "#0a120d", touchAction: "none" },
  svg: { position: "absolute", top: 0, left: 0, pointerEvents: "none" },

  node: { position: "absolute", width: NODE_W, background: "#0f1d14", border: "1.5px solid #1d3328", borderRadius: 12, userSelect: "none" },
  nodeHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", fontSize: 12, fontWeight: 800, borderRadius: "10px 10px 0 0", cursor: "grab" },
  entryBadge: { fontSize: 9, fontWeight: 800, background: "#25D366", color: "#06130b", padding: "1px 6px", borderRadius: 6 },
  nodeBody: { padding: "8px 10px" },
  menuRow: { fontSize: 11, color: "#e6f4ec", background: "#14261a", borderRadius: 6, padding: "3px 8px", marginTop: 5 },
  chip: { display: "inline-block", marginTop: 6, fontSize: 10, fontFamily: mono, color: "#B983FF", background: "#B983FF1a", padding: "2px 8px", borderRadius: 6 },
  port: { position: "absolute", width: 14, height: 14, borderRadius: "50%", border: "2.5px solid #0a120d", cursor: "crosshair", zIndex: 5 },
  warnFloat: { position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "#3a2a10", border: "1px solid #F5B841", color: "#F5B841", fontSize: 12, padding: "6px 14px", borderRadius: 8 },

  inspector: { width: 260, padding: 14, borderLeft: "1px solid #16281e", overflowY: "auto", background: "#0c1610", flexShrink: 0 },
  input: { boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #2a4535", background: "#0a120d", color: "#e6f4ec", fontSize: 12.5, outline: "none", fontFamily: "inherit", width: "100%" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #2a4535", background: "#0a120d", color: "#e6f4ec", fontSize: 12.5, outline: "none", resize: "vertical", fontFamily: "inherit" },
  miniBtn: { padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #2a4535", background: "#0d1b13", color: "#8fae9d", cursor: "pointer", fontFamily: "inherit" },
  addBtn: { width: "100%", padding: "7px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px dashed #2fbf71", background: "transparent", color: "#2fbf71", cursor: "pointer", fontFamily: "inherit" },
  dangerBtn: { width: "100%", marginTop: 8, padding: "8px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px solid #5a2626", background: "#1d0f0f", color: "#FF7A7A", cursor: "pointer", fontFamily: "inherit" },
  primaryBtn: { padding: "9px 18px", fontSize: 13, fontWeight: 800, borderRadius: 9, border: "none", background: "#25D366", color: "#06130b", cursor: "pointer", fontFamily: "inherit" },
  ghostBtn: { padding: "8px 14px", fontSize: 12.5, fontWeight: 700, borderRadius: 9, border: "1px solid #2a4535", background: "#0d1b13", color: "#9be8c0", cursor: "pointer", fontFamily: "inherit" },

  codeWrap: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 16, gap: 10 },
  codeBar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  warnBar: { padding: "8px 12px", borderRadius: 8, background: "#3a2a10", border: "1px solid #F5B841", color: "#F5B841", fontSize: 12 },
  codeBox: { flex: 1, margin: 0, overflow: "auto", background: "#060d09", border: "1px solid #16281e", borderRadius: 12, padding: 16, fontSize: 11.5, lineHeight: 1.55, color: "#9be8c0", fontFamily: mono, whiteSpace: "pre" },
  inlineCode: { fontFamily: mono, fontSize: 11, background: "#06130b", padding: "1px 6px", borderRadius: 5, color: "#9be8c0" },

  activateWrap: { flex: 1, display: "flex", gap: 18, padding: 18, overflow: "auto", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" },
  credCard: { width: 360, maxWidth: "100%", background: "#0c1610", border: "1px solid #16281e", borderRadius: 14, padding: 18 },
  liveBox: { marginTop: 14, padding: 12, borderRadius: 10, background: "#0d1f14", border: "1px solid #2fbf71" },

  phone: { width: 340, maxWidth: "100%", height: 560, display: "flex", flexDirection: "column", background: "#0c1610", border: "1px solid #16281e", borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.5)" },
  phoneHeader: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#128C7E22", borderBottom: "1px solid #16281e" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  phoneBody: { flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 7, backgroundImage: "radial-gradient(#14261a 1px, transparent 1px)", backgroundSize: "16px 16px" },
  bubble: { maxWidth: "80%", padding: "8px 11px", borderRadius: 12, fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  bubbleBot: { background: "#14261a", border: "1px solid #1d3328", borderTopLeftRadius: 3 },
  bubbleMe: { background: "#128C7E", color: "#eafff5", borderTopRightRadius: 3 },
  phoneInput: { display: "flex", gap: 8, padding: 10, borderTop: "1px solid #16281e" },
};
