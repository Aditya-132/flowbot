import { useState, useRef, useEffect } from "react";
import { api, getToken, setToken } from "./api.js";
import AuthPage from "./Auth.jsx";
import { TEMPLATES } from "./templates.js";

/* ============================================================
   FlowBot — WhatsApp Bot Builder (full-stack)
   Design a flowchart → backend stores it → deterministic code
   export → activate with provider creds → live webhook + simulator.
   38 pre-embedded features. NO AI in the bot runtime.
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
    outputs: (c) => (c.options || []).length,
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
    outputs: () => 0,
  },
  text: {
    label: "Text Message", icon: "✉️", color: "#60A5FA",
    desc: "Sends a plain message and continues.",
    defaults: () => ({ message: "Here is the information you asked for." }),
  },
  quick_reply: {
    label: "Quick Replies", icon: "⚡", color: "#FACC15",
    desc: "Small choice list; each choice gets a branch.",
    defaults: () => ({ prompt: "Pick one:", options: ["Yes", "No"] }),
    outputs: (c) => (c.options || []).length,
  },
  link: {
    label: "Send Link", icon: "🔗", color: "#38BDF8",
    desc: "Shares a URL with a short message.",
    defaults: () => ({ message: "Open this link:", url: "https://example.com" }),
  },
  image: {
    label: "Image / Media Link", icon: "🖼️", color: "#A78BFA",
    desc: "Sends an image or media URL as a WhatsApp-safe text link.",
    defaults: () => ({ caption: "Here is the image:", url: "https://example.com/image.jpg" }),
  },
  coupon: {
    label: "Coupon Code", icon: "🏷️", color: "#FB7185",
    desc: "Shares an offer or discount code.",
    defaults: () => ({ message: "Limited-time offer:", code: "SAVE10" }),
  },
  product_card: {
    label: "Product Card", icon: "🛍️", color: "#34D399",
    desc: "Shows one product with price, details, and link.",
    defaults: () => ({ name: "Classic Sneakers", price: "₹1,999", description: "Comfortable daily wear sneakers.", link: "https://example.com/products/sneakers" }),
  },
  catalog: {
    label: "Mini Catalog", icon: "📦", color: "#22C55E",
    desc: "Lists products or services inside chat.",
    defaults: () => ({
      title: "Popular products",
      items: [
        { name: "Classic Sneakers", price: "₹1,999" },
        { name: "Travel Backpack", price: "₹1,499" },
      ],
    }),
  },
  product_search: {
    label: "Product Search", icon: "🔎", color: "#06B6D4",
    desc: "Asks a keyword, then replies with a matching product.",
    defaults: () => ({
      question: "What product are you looking for?",
      notFound: "I could not find that product. Try another keyword.",
      items: [
        { name: "Sneakers", keywords: "shoes footwear", price: "₹1,999", description: "Comfortable daily wear sneakers.", link: "https://example.com/sneakers" },
        { name: "Backpack", keywords: "bag travel school", price: "₹1,499", description: "Lightweight everyday backpack.", link: "https://example.com/backpack" },
      ],
    }),
    outputs: () => 2,
  },
  order_status: {
    label: "Order Status", icon: "🧾", color: "#F97316",
    desc: "Collects an order ID and stores it as {orderId}.",
    defaults: () => ({ question: "Please share your order ID:", ack: "Thanks. Checking order {orderId}. Our team will update you shortly." }),
  },
  tracking_link: {
    label: "Tracking Link", icon: "🚚", color: "#84CC16",
    desc: "Collects tracking ID and returns a tracking URL.",
    defaults: () => ({ question: "Please enter your tracking ID:", baseUrl: "https://example.com/track/", ack: "Tracking link: {baseUrl}{trackingId}" }),
  },
  appointment: {
    label: "Appointment Booking", icon: "📅", color: "#C084FC",
    desc: "Collects preferred date/time.",
    defaults: () => ({ question: "What date and time works for you?", ack: "Appointment request saved for {appointmentTime}." }),
  },
  booking_confirm: {
    label: "Booking Confirm", icon: "✅", color: "#2DD4BF",
    desc: "Confirms booking using collected variables.",
    defaults: () => ({ message: "Confirmed. We have your request for {appointmentTime}." }),
  },
  lead_qualify: {
    label: "Lead Qualification", icon: "🎯", color: "#F59E0B",
    desc: "Branches by lead intent, budget, or need.",
    defaults: () => ({ prompt: "What best describes you?", options: ["Ready to buy", "Just comparing", "Need a demo"] }),
    outputs: (c) => (c.options || []).length,
  },
  collect_email: {
    label: "Collect Email", icon: "📧", color: "#818CF8",
    desc: "Asks and saves {email}.",
    defaults: () => ({ question: "Please share your email:", ack: "Thanks, I saved your email." }),
  },
  collect_phone: {
    label: "Collect Phone", icon: "📞", color: "#14B8A6",
    desc: "Asks and saves {phone}.",
    defaults: () => ({ question: "Please share your phone number:", ack: "Thanks, I saved your phone number." }),
  },
  collect_address: {
    label: "Collect Address", icon: "📍", color: "#F43F5E",
    desc: "Asks and saves {address}.",
    defaults: () => ({ question: "Please share your delivery address:", ack: "Thanks, I saved your address." }),
  },
  csat: {
    label: "CSAT Rating", icon: "⭐", color: "#FBBF24",
    desc: "Collects a 1-5 satisfaction score; each rating can branch.",
    defaults: () => ({ question: "Rate your experience from 1 to 5.", field: "rating", thanks: "Thanks for rating us {rating}/5." }),
    outputs: () => 5,
  },
  feedback: {
    label: "Feedback", icon: "🗣️", color: "#93C5FD",
    desc: "Collects free-text feedback as {feedback}.",
    defaults: () => ({ question: "What should we improve?", ack: "Thanks for the feedback." }),
  },
  language: {
    label: "Language Router", icon: "🌐", color: "#67E8F9",
    desc: "Lets customers choose language and branches.",
    defaults: () => ({ prompt: "Choose language:", options: ["English", "हिन्दी", "मराठी"] }),
    outputs: (c) => (c.options || []).length,
  },
  business_hours: {
    label: "Business Hours", icon: "🕒", color: "#A3E635",
    desc: "Branches based on server time.",
    defaults: () => ({ startHour: 9, endHour: 18, openMessage: "We are open right now.", closedMessage: "We are closed right now. Leave a message and we will reply soon." }),
    outputs: () => 2,
  },
  human_handoff: {
    label: "Human Handoff", icon: "🙋", color: "#F87171",
    desc: "Marks handoff and tells the user a person will take over.",
    defaults: () => ({ message: "I am connecting you to a human teammate. Please wait." }),
  },
  tag_customer: {
    label: "Tag Customer", icon: "🏷️", color: "#FB923C",
    desc: "Adds a lightweight tag to session variables.",
    defaults: () => ({ tag: "hot_lead", message: "Tagged as hot_lead." }),
  },
  set_variable: {
    label: "Set Variable", icon: "🧩", color: "#4ADE80",
    desc: "Stores a fixed value, like {plan} or {source}.",
    defaults: () => ({ field: "plan", value: "starter", message: "Saved {plan} plan." }),
  },
  condition: {
    label: "Condition", icon: "🔀", color: "#F472B6",
    desc: "Branches if a variable equals or contains a value.",
    defaults: () => ({ field: "plan", operator: "equals", value: "starter", trueMessage: "Matched.", falseMessage: "Did not match." }),
    outputs: () => 2,
  },
  save_note: {
    label: "Save Note", icon: "🗒️", color: "#CBD5E1",
    desc: "Creates an internal note in session variables.",
    defaults: () => ({ field: "note", note: "Customer asked about pricing.", message: "Note saved." }),
  },
  payment_link: {
    label: "Payment Link", icon: "💳", color: "#10B981",
    desc: "Shares checkout or payment URL.",
    defaults: () => ({ message: "You can pay here:", url: "https://example.com/pay" }),
  },
  return_policy: {
    label: "Return Policy", icon: "↩️", color: "#FCA5A5",
    desc: "Answers returns/exchange questions.",
    defaults: () => ({ message: "Returns are accepted within 7 days for unused items with original packaging." }),
  },
  shipping_info: {
    label: "Shipping Info", icon: "📮", color: "#86EFAC",
    desc: "Answers delivery fee and timeline questions.",
    defaults: () => ({ message: "Standard delivery takes 2-4 business days. Shipping is free above ₹999." }),
  },
  abandoned_cart: {
    label: "Cart Recovery", icon: "🛒", color: "#FDBA74",
    desc: "Nudges a shopper back to checkout.",
    defaults: () => ({ message: "Looks like you left something in your cart. Want help completing the order?" }),
  },
  review_request: {
    label: "Review Request", icon: "💚", color: "#6EE7B7",
    desc: "Asks happy customers for a review.",
    defaults: () => ({ message: "If you liked the experience, please leave us a quick review: https://example.com/review" }),
  },
  collect_number: {
    label: "Collect Number", icon: "#️⃣", color: "#FDE047",
    desc: "Asks a numeric question (guests, room no.) and validates the reply.",
    defaults: () => ({ question: "How many guests?", field: "guests", ack: "Got it." }),
  },
  location: {
    label: "Location / Map", icon: "🗺️", color: "#5EEAD4",
    desc: "Sends your address with a Google Maps link.",
    defaults: () => ({ title: "Our address", address: "12 MG Road, Pune 411001", mapsUrl: "https://maps.google.com/?q=example" }),
  },
  contact_card: {
    label: "Contact Card", icon: "📇", color: "#FDA4AF",
    desc: "Shares phone, email and website in one card.",
    defaults: () => ({ title: "Reach us", phone: "+91 98765 43210", email: "hello@example.com", website: "https://example.com" }),
  },
};

const menuLikeTypes = new Set(["menu", "quick_reply", "language", "lead_qualify"]);
const branchLabels = {
  condition: ["true", "false"],
  business_hours: ["open", "closed"],
  product_search: ["found", "not found"],
  csat: ["1", "2", "3", "4", "5"],
};

/* ---------- custom blocks (Block Lab) ---------- */
const STEP_KINDS = {
  say: { label: "Send message", icon: "💬" },
  ask: { label: "Ask & save answer", icon: "❓" },
  set: { label: "Set variable", icon: "🧩" },
  choice: { label: "Choices (branches)", icon: "🔀" },
};
const stepDefaults = {
  say: () => ({ kind: "say", message: "Here is some information." }),
  ask: () => ({ kind: "ask", question: "What's your answer?", field: "answer", validate: "text", ack: "" }),
  set: () => ({ kind: "set", field: "source", value: "whatsapp" }),
  choice: () => ({ kind: "choice", prompt: "Pick one:", options: ["Option A", "Option B"] }),
};
const stepSummary = (s) =>
  s.kind === "say" ? s.message
    : s.kind === "ask" ? `${s.question} → {${s.field || "value"}}`
      : s.kind === "set" ? `{${s.field}} = ${s.value}`
        : `${s.prompt} · ${(s.options || []).length} branches`;
const customSteps = (n) => (Array.isArray(n.config?.steps) ? n.config.steps : []);
const lastChoice = (n) => {
  const steps = customSteps(n);
  const last = steps[steps.length - 1];
  return last && last.kind === "choice" ? last : null;
};

// resolves look & label for both built-in and user-made blocks
const typeInfo = (n) =>
  n.type === "custom"
    ? { label: n.config?.label || "Custom block", icon: n.config?.icon || "🧩", color: n.config?.color || "#9be8c0", desc: "Your custom block" }
    : NODE_TYPES[n.type];

/* ---------- geometry ---------- */
const listRows = (n) => {
  if (menuLikeTypes.has(n.type)) return n.config.options?.length || 0;
  if (n.type === "faq") return n.config.pairs?.length || 0;
  if (n.type === "catalog" || n.type === "product_search") return n.config.items?.length || 0;
  if (n.type === "csat") return 5;
  if (n.type === "custom") return Math.min(customSteps(n).length, 8);
  return 0;
};
const nodeH = (n) => Math.max(90, 66 + listRows(n) * 26 + 12);
const outPortPos = (n, i) =>
  outputCount(n) > 1 ? { x: n.x + NODE_W, y: n.y + 66 + i * 26 + 13 } : { x: n.x + NODE_W, y: n.y + 60 };
const inPortPos = (n) => ({ x: n.x, y: n.y + 18 });
const outputCount = (n) => {
  if (n.type === "custom") {
    const c = lastChoice(n);
    return c ? Math.max(c.options.length, 1) : 1;
  }
  const fn = NODE_TYPES[n.type]?.outputs;
  if (!fn) return 1;
  const k = fn(n.config || {});
  return Number.isFinite(k) && k > 0 ? k : 1;
};
const portLabel = (n, i) => {
  if (menuLikeTypes.has(n.type)) return (n.config.options || [])[i] || `option ${i + 1}`;
  if (n.type === "custom") return (lastChoice(n)?.options || [])[i] || "";
  if (branchLabels[n.type]) return branchLabels[n.type][i] || "";
  return "";
};
const bez = (a, b) => {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
};
const uid = () => Math.random().toString(36).slice(2, 9);

// true below 860px — palette becomes a drawer, inspector a bottom sheet
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 860px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}
const nodeSummary = (n) => {
  const c = n.config || {};
  if (menuLikeTypes.has(n.type)) return `${c.prompt || "Choose"} · ${(c.options || []).join(", ")}`;
  if (n.type === "faq") return `${(c.pairs || []).length} keyword repl${(c.pairs || []).length === 1 ? "y" : "ies"}: ${(c.pairs || []).map((p) => p.k).join(", ")}`;
  if (n.type === "collect") return `${c.question} · saves {${c.field}}`;
  if (n.type === "product_card") return `${c.name} · ${c.price}`;
  if (n.type === "catalog") return `${c.title} · ${(c.items || []).length} items`;
  if (n.type === "product_search") return `${c.question} · ${(c.items || []).length} searchable items`;
  if (n.type === "business_hours") return `${c.startHour}:00-${c.endHour}:00`;
  if (n.type === "condition") return `{${c.field}} ${c.operator || "equals"} ${c.value}`;
  if (n.type === "custom") return `${customSteps(n).length} step${customSteps(n).length === 1 ? "" : "s"}`;
  return c.message || c.question || c.caption || c.url || c.note || NODE_TYPES[n.type]?.desc || "";
};

/* ---------- app shell: builder is open to guests; auth appears as a
   modal only when saving, making blocks, exporting code or activating ---------- */
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking session

  useEffect(() => {
    if (!getToken()) return setUser(null);
    api.me().then((d) => setUser(d.user)).catch(() => { setToken(null); setUser(null); });
  }, []);

  const logout = async () => {
    try { await api.logout(); } catch { /* session may already be gone */ }
    setToken(null);
    setUser(null);
  };

  if (user === undefined) {
    return (
      <div style={{ ...styles.app, alignItems: "center", justifyContent: "center", fontSize: 14, color: "#8fae9d" }}>
        Loading…
      </div>
    );
  }
  return <Builder user={user} onAuthed={setUser} onLogout={logout} />;
}

function Builder({ user, onAuthed, onLogout }) {
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
  const [hoveredEdge, setHoveredEdge] = useState(null);
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
  const [customBlocks, setCustomBlocks] = useState([]);
  const [blockLab, setBlockLab] = useState(null); // null | draft {id?, name, icon, color, descr, steps}
  const [authOpen, setAuthOpen] = useState(false);
  const isMobile = useIsMobile();
  const [showPalette, setShowPalette] = useState(false); // mobile drawer
  const pendingAuth = useRef(null); // action to resume after a successful login
  const userRef = useRef(user);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  const hasWelcome = nodes.some((n) => n.type === "welcome");
  const selNode = nodes.find((n) => n.id === sel);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => {
    if (user) { refreshList(); refreshBlocks(); }
    else { setSavedFlows([]); setCustomBlocks([]); }
  }, [user]);

  // Gate an action behind login: run it now, or open the auth modal and
  // resume it right after a successful login/signup.
  const needAuth = (action) => {
    if (userRef.current) return action();
    pendingAuth.current = action;
    setAuthOpen(true);
  };
  const handleAuthed = (u) => {
    userRef.current = u;
    onAuthed(u);
    setAuthOpen(false);
    const fn = pendingAuth.current;
    pendingAuth.current = null;
    if (fn) setTimeout(fn, 0); // let state settle, then resume what they were doing
  };
  const handleLogout = () => {
    onLogout();
    // the flow on canvas stays, but it no longer points at a server-side bot
    setBotId(null); setActivated(false); setActivation(null); setDirty(true); setChat([]);
  };
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const flash = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2400); };
  const refreshList = () => api.listFlows().then(setSavedFlows).catch(() => {});
  const refreshBlocks = () => api.listBlocks().then(setCustomBlocks).catch(() => {});
  const markDirty = () => setDirty(true);
  const webhookFor = (p, id) =>
    p === "meta" ? `/meta/webhook/${id}` : p === "green" ? `/green/webhook/${id}` : p === "whapi" ? `/whapi/webhook/${id}` : `/whatsapp/${id}`;

  /* ---------- persistence ---------- */
  // Returns the bot id on success, null on failure (avoids stale-state reads
  // right after the first save creates the id).
  async function saveFlow() {
    if (!userRef.current) { needAuth(() => saveFlow()); return null; }
    setBusy(true);
    try {
      let id = botId;
      if (id) {
        await api.updateFlow(id, { name: botName, nodes, edges });
      } else {
        const created = await api.createFlow({ name: botName, nodes, edges });
        id = created.id;
        setBotId(id);
      }
      setDirty(false);
      refreshList();
      flash("💾 Flow saved");
      return id;
    } catch (e) {
      flash("Save failed: " + e.message, true);
      return null;
    } finally { setBusy(false); }
  }

  async function ensureSaved() {
    if (!dirty && botId) return botId;
    return saveFlow();
  }

  async function loadFlow(id) {
    try {
      const f = await api.getFlow(id);
      // drop blocks of unknown type and wires pointing at missing blocks
      const loadedNodes = (f.nodes || []).filter((n) => NODE_TYPES[n.type] || n.type === "custom");
      const ids = new Set(loadedNodes.map((n) => n.id));
      const loadedEdges = (f.edges || []).filter((e) => ids.has(e.from) && ids.has(e.to));
      setBotId(f.id); setBotName(f.name); setNodes(loadedNodes); setEdges(loadedEdges);
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

  function loadTemplate(key) {
    const t = TEMPLATES[key];
    if (!t) return;
    newFlow();
    setBotName(t.name);
    setNodes(t.nodes());
    setEdges(t.edges());
    flash(`${t.emoji} Template loaded: ${t.name} — hit Save to keep it`);
  }

  /* ---------- tab switching (auto-saves before code/activate) ---------- */
  async function goTab(i) {
    if (i > 0 && !userRef.current) { needAuth(() => goTab(i)); return; }
    if (i > 0) {
      const id = await ensureSaved();
      if (!id) return;
      if (i === 1) {
        try { setCode(await api.getCode(id)); } catch { setCode("// could not load code — is the backend running?"); }
      }
      if (i === 2 && chat.length === 0) resetChat(id);
    }
    setTab(i);
  }

  useEffect(() => {
    if (tab === 1 && botId) api.getCode(botId).then(setCode).catch(() => {});
  }, [tab, botId, dirty]);

  /* ---------- canvas interactions ---------- */
  const canvasXY = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left + canvasRef.current.scrollLeft, y: e.clientY - r.top + canvasRef.current.scrollTop };
  };
  const suppressCanvasClick = useRef(false);

  const startDrag = (e, n) => {
    e.stopPropagation();
    e.preventDefault();
    const p = canvasXY(e);
    setDrag({ id: n.id, dx: p.x - n.x, dy: p.y - n.y });
    setSel(n.id);
  };
  const startConnect = (e, n, port) => {
    e.stopPropagation();
    e.preventDefault();
    const p = outPortPos(n, port);
    setConnecting({ from: n.id, port, x: p.x, y: p.y, sx: e.clientX, sy: e.clientY, moved: false });
  };
  const connectTo = (targetId) => {
    setConnecting((conn) => {
      if (!conn) return null;
      const target = nodes.find((n) => n.id === targetId);
      if (!target || conn.from === targetId) return null;
      if (target.type === "welcome") {
        flash("Welcome is the entry point — it can't receive a connection.", true);
        return null;
      }
      setEdges((es) => [
        ...es.filter((x) => !(x.from === conn.from && x.fromPort === conn.port)),
        { id: uid(), from: conn.from, fromPort: conn.port, to: targetId },
      ]);
      markDirty();
      return null;
    });
  };

  // Window-level drag/connect handling: never loses the pointer, supports both
  // drag-to-connect (release on target) and click-then-click wiring.
  useEffect(() => {
    if (!drag && !connecting) return;
    const onMove = (e) => {
      const p = canvasXY(e);
      if (drag) {
        setNodes((ns) => ns.map((n) => (n.id === drag.id ? { ...n, x: Math.max(0, p.x - drag.dx), y: Math.max(0, p.y - drag.dy) } : n)));
        markDirty();
      } else {
        setConnecting((c) => c && { ...c, x: p.x, y: p.y, moved: c.moved || Math.hypot(e.clientX - c.sx, e.clientY - c.sy) > 6 });
      }
    };
    const onUp = (e) => {
      if (drag) { setDrag(null); return; }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const nodeEl = el && el.closest ? el.closest("[data-node-id]") : null;
      if (nodeEl && nodeEl.getAttribute("data-node-id") !== connecting.from) {
        connectTo(nodeEl.getAttribute("data-node-id"));
        suppressCanvasClick.current = true;
      } else if (connecting.moved) {
        // dragged out into empty space → cancel
        setConnecting(null);
        suppressCanvasClick.current = true;
      }
      // plain click on the output dot → stay in click-then-click mode
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [drag, connecting, nodes]);

  // Keyboard: Esc cancels wiring/selection, Delete removes the selected block.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setConnecting(null); setSel(null); return; }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && sel && tab === 0) deleteNode(sel);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, tab]);

  const addNode = (type) => {
    if (type === "welcome" && hasWelcome) {
      flash("Your flow already has a Welcome block — there can be only one entry point.", true);
      return;
    }
    const view = canvasRef.current;
    const baseX = (view?.scrollLeft || 0) + 120;
    const baseY = (view?.scrollTop || 0) + 80;
    const n = { id: uid(), type, x: baseX + Math.random() * 120, y: baseY + Math.random() * 140, config: NODE_TYPES[type].defaults() };
    setNodes((ns) => [...ns, n]); setSel(n.id); markDirty();
  };
  // drop an instance of a user-made block: its look + steps are copied into the
  // node config, so the flow stays self-contained (simulator, live, ZIP export)
  const addCustomNode = (def) => {
    const view = canvasRef.current;
    const n = {
      id: uid(), type: "custom",
      x: (view?.scrollLeft || 0) + 120 + Math.random() * 120,
      y: (view?.scrollTop || 0) + 80 + Math.random() * 140,
      config: { label: def.name, icon: def.icon, color: def.color, steps: JSON.parse(JSON.stringify(def.steps || [])) },
    };
    setNodes((ns) => [...ns, n]); setSel(n.id); markDirty();
  };

  async function saveBlockLab() {
    if (!blockLab) return;
    if (!userRef.current) { needAuth(() => saveBlockLab()); return; }
    if (!(blockLab.steps || []).length) return flash("Add at least one step to your block.", true);
    try {
      const saved = blockLab.id
        ? await api.updateBlock(blockLab.id, blockLab)
        : await api.createBlock(blockLab);
      refreshBlocks();
      setBlockLab(null);
      flash(`🧪 Block saved: ${saved.name} — it's in your palette now`);
    } catch (e) { flash("Could not save block: " + e.message, true); }
  }
  const deleteNode = (id) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id));
    setSel(null); setConnecting(null); markDirty();
  };
  const updateConfig = (id, patch) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, config: { ...n.config, ...patch } } : n)));
    markDirty();
  };
  // Removing option i: drop its edge and shift edges on higher ports down one,
  // so remaining branches keep pointing at the right blocks.
  const removeOption = (node, i) => {
    const options = (node.config.options || []).filter((_, j) => j !== i);
    if (!options.length) return;
    updateConfig(node.id, { options });
    setEdges((es) =>
      es
        .filter((e2) => !(e2.from === node.id && e2.fromPort === i))
        .map((e2) => (e2.from === node.id && e2.fromPort > i ? { ...e2, fromPort: e2.fromPort - 1 } : e2))
    );
  };

  /* ---------- activation + simulator (both via backend) ---------- */
  async function activateBot() {
    if (!userRef.current) { needAuth(activateBot); return; }
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

  async function resetChat(idOverride) {
    const id = idOverride || botId;
    if (!id) return;
    await api.simulate(id, { from: "simulator", reset: true }).catch(() => {});
    setChat([{ side: "bot", text: "Simulator ready — say hi! Messages run through the backend's live engine." }]);
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || !botId) return;
    setChatInput("");
    setChat((c) => [...c, { side: "me", text }]);
    try {
      const { replies } = await api.simulate(botId, { from: "simulator", message: text });
      setChat((c) => [...c, ...replies.map((t) => ({ side: "bot", text: t }))]);
    } catch (e) {
      setChat((c) => [...c, { side: "bot", text: "⚠️ " + (e.message || "The backend did not respond.") }]);
    }
  }

  const copyCode = () => {
    const ta = document.createElement("textarea");
    ta.value = code;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); flash("✓ Code copied"); } catch {}
    document.body.removeChild(ta);
  };
  const downloadZip = async () => {
    if (!userRef.current) { needAuth(downloadZip); return; }
    const id = await ensureSaved();
    if (!id) return;
    try {
      const blob = await api.getCodeZip(id);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(botName || "flowbot").toLowerCase().replace(/[^a-z0-9-]+/g, "-")}-bot.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      flash("📦 Full project downloaded as ZIP");
    } catch (e) { flash("Download failed: " + e.message, true); }
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
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexWrap: "wrap" }}>
          <div style={S.logo}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>FlowBot</div>
            {!isMobile && <div style={{ fontSize: 10.5, color: "#8fae9d" }}>flowchart → WhatsApp bot · no-AI runtime</div>}
          </div>
          <input style={{ ...S.input, width: isMobile ? 120 : 190 }} value={botName}
            onChange={(e) => { setBotName(e.target.value); markDirty(); }} placeholder="Bot name" />
          <button style={S.ghostBtn} onClick={saveFlow} disabled={busy}>
            {dirty ? "💾 Save*" : "✓ Saved"}
          </button>
          <select style={{ ...S.input, width: isMobile ? 130 : 160 }} value=""
            onChange={(e) => e.target.value && loadFlow(e.target.value)}>
            <option value="">📂 Open saved bot…</option>
            {savedFlows.map((f) => (
              <option key={f.id} value={f.id}>{f.name} {f.active ? "· live" : ""}</option>
            ))}
          </select>
          <button style={S.ghostBtn} onClick={newFlow}>+ New</button>
          <select style={{ ...S.input, width: isMobile ? 130 : 180 }} value=""
            onChange={(e) => e.target.value && loadTemplate(e.target.value)}>
            <option value="">✨ Start from template…</option>
            {Object.entries(TEMPLATES).map(([k, t]) => (
              <option key={k} value={k}>{t.emoji} {t.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {(isMobile ? ["🎨 Design", "💻 Code", "🚀 Go live"] : ["1 · Design flow", "2 · Bot code", "3 · Activate & test"]).map((t, i) => (
            <button key={t} onClick={() => goTab(i)} style={{ ...S.tab, ...(isMobile ? { padding: "7px 10px" } : {}), ...(tab === i ? S.tabActive : {}) }}>{t}</button>
          ))}
          {user ? (<>
            <span style={{ fontSize: 11.5, color: "#8fae9d", marginLeft: 8, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={user.email}>
              👤 {user.name || user.email}
            </span>
            <button style={S.ghostBtn} onClick={handleLogout}>Log out</button>
          </>) : (
            <button style={{ ...S.primaryBtn, marginLeft: 8 }} onClick={() => setAuthOpen(true)}>🔐 Log in / Sign up</button>
          )}
        </div>
      </div>

      {toast && <div style={{ ...S.toast, background: toast.err ? "#3a1414" : "#0d2a1a", borderColor: toast.err ? "#FF7A7A" : "#2fbf71", color: toast.err ? "#ffb3b3" : "#9be8c0" }}>{toast.msg}</div>}

      {/* ============ AUTH MODAL: only when an action needs an account ============ */}
      {authOpen && (
        <AuthPage modal onAuth={handleAuthed}
          onClose={() => { setAuthOpen(false); pendingAuth.current = null; }} />
      )}

      {/* ============ BLOCK LAB: design your own feature block ============ */}
      {blockLab && (
        <div style={S.overlay} onClick={() => setBlockLab(null)}>
          <div style={S.labCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>🧪 Block Lab — {blockLab.id ? "edit block" : "invent a new block"}</div>
              <button style={S.miniBtn} onClick={() => setBlockLab(null)}>✕ close</button>
            </div>
            <div style={{ fontSize: 11.5, color: "#8fae9d", marginBottom: 12, lineHeight: 1.5 }}>
              Chain simple steps into any feature you can imagine. It becomes a reusable block in your palette
              and runs everywhere — simulator, live WhatsApp, exported code. Use {"{variables}"} anywhere.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Field label="Icon (emoji)">
                <input style={{ ...S.input, width: 64, textAlign: "center" }} value={blockLab.icon}
                  onChange={(e) => setBlockLab({ ...blockLab, icon: e.target.value.slice(0, 4) })} />
              </Field>
              <div style={{ flex: 1 }}>
                <Field label="Block name">
                  <input style={S.input} value={blockLab.name}
                    onChange={(e) => setBlockLab({ ...blockLab, name: e.target.value })} />
                </Field>
              </div>
            </div>
            <Field label="Short description (shows in the palette)">
              <input style={S.input} value={blockLab.descr} placeholder="e.g. 3-question quiz that saves a score"
                onChange={(e) => setBlockLab({ ...blockLab, descr: e.target.value })} />
            </Field>
            <Field label="Color">
              <div style={{ display: "flex", gap: 6 }}>
                {["#9BE8C0", "#F5B841", "#4EA8DE", "#B983FF", "#FF7A7A", "#34D399", "#F472B6", "#67E8F9"].map((c) => (
                  <button key={c} onClick={() => setBlockLab({ ...blockLab, color: c })}
                    style={{ width: 26, height: 26, borderRadius: 8, background: c, cursor: "pointer", border: blockLab.color === c ? "2.5px solid #e6f4ec" : "2.5px solid transparent" }} />
                ))}
              </div>
            </Field>
            <Field label="Steps (run top to bottom)">
              <StepsEditor steps={blockLab.steps} onChange={(steps) => setBlockLab({ ...blockLab, steps })} />
            </Field>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button style={S.ghostBtn} onClick={() => setBlockLab(null)}>Cancel</button>
              <button style={S.primaryBtn} onClick={saveBlockLab}>💾 Save block</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB 1: DESIGN ============ */}
      {tab === 0 && (
        <div style={S.designWrap}>
          {isMobile && showPalette && <div style={S.drawerBackdrop} onClick={() => setShowPalette(false)} />}
          <div style={isMobile ? { ...S.palette, ...S.paletteDrawer, ...(showPalette ? {} : { display: "none" }) } : S.palette}>
            {isMobile && (
              <button style={{ ...S.ghostBtn, width: "100%", marginBottom: 10 }} onClick={() => setShowPalette(false)}>✕ Close blocks</button>
            )}
            <div style={S.paneTitle}>🧪 Your custom blocks</div>
            <button style={{ ...S.addBtn, marginBottom: 8 }} onClick={() => setBlockLab({ name: "My block", icon: "🧪", color: "#9BE8C0", descr: "", steps: [stepDefaults.say()] })}>
              ＋ Create your own block
            </button>
            {customBlocks.map((b) => (
              <div key={b.id} style={{ ...S.paletteItem, position: "relative", paddingRight: 30 }}>
                <span style={{ fontSize: 18, cursor: "pointer" }} onClick={() => { addCustomNode(b); if (isMobile) setShowPalette(false); }}>{b.icon}</span>
                <span style={{ cursor: "pointer", flex: 1 }} onClick={() => { addCustomNode(b); if (isMobile) setShowPalette(false); }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 13, color: b.color }}>{b.name}</span>
                  <span style={{ display: "block", fontSize: 11, color: "#8fae9d", lineHeight: 1.35 }}>
                    {b.descr || `${(b.steps || []).length} step${(b.steps || []).length === 1 ? "" : "s"} · tap to add`}
                  </span>
                </span>
                <button title="Edit block" style={{ ...S.miniBtn, position: "absolute", right: 4, top: 6, padding: "2px 5px" }}
                  onClick={(e) => { e.stopPropagation(); setBlockLab({ ...b, steps: JSON.parse(JSON.stringify(b.steps || [])) }); }}>✎</button>
                <button title="Delete block" style={{ ...S.miniBtn, position: "absolute", right: 4, top: 30, padding: "2px 5px", color: "#FF7A7A" }}
                  onClick={async (e) => { e.stopPropagation(); await api.deleteBlock(b.id).catch(() => {}); refreshBlocks(); }}>✕</button>
              </div>
            ))}
            {!customBlocks.length && (
              <div style={{ fontSize: 11, color: "#7d9c8c", marginBottom: 10 }}>
                Dream up any feature — a quiz, an EMI enquiry, a visitor pass — and build it from simple steps. It runs everywhere: simulator, live bot, exported ZIP.
              </div>
            )}

            <div style={{ ...S.paneTitle, marginTop: 14 }}>Feature blocks</div>
            <div style={{ fontSize: 11, color: "#7d9c8c", marginBottom: 10 }}>
              38 deterministic WhatsApp blocks backed by pre-written server handlers.
            </div>
            {Object.entries(NODE_TYPES).map(([k, t]) => (
              <button key={k} onClick={() => { addNode(k); if (isMobile) setShowPalette(false); }} style={S.paletteItem}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 13, color: t.color }}>{t.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: "#8fae9d", lineHeight: 1.35 }}>{t.desc}</span>
                </span>
              </button>
            ))}
            <div style={S.tipBox}>
              💡 Drag blocks by their header · to wire, <b>drag from a right dot onto any block</b> (or click the dot, then click the target) · click a wire to delete it · <b>Esc</b> cancels · <b>Delete</b> removes the selected block.
            </div>
          </div>

          <div ref={canvasRef} style={{ ...S.canvas, cursor: connecting ? "crosshair" : "default" }}
            onClick={() => {
              if (suppressCanvasClick.current) { suppressCanvasClick.current = false; return; }
              setSel(null); setConnecting(null);
            }}>
            <svg style={S.svg}
              width={Math.max(2400, ...nodes.map((n) => n.x + NODE_W + 400))}
              height={Math.max(1600, ...nodes.map((n) => n.y + nodeH(n) + 400))}>
              {edges.map((e) => {
                const a = nodes.find((n) => n.id === e.from);
                const b = nodes.find((n) => n.id === e.to);
                if (!a || !b || e.fromPort >= outputCount(a)) return null;
                const pa = outPortPos(a, e.fromPort);
                const d = bez(pa, inPortPos(b));
                const hot = hoveredEdge === e.id;
                const label = outputCount(a) > 1 ? portLabel(a, e.fromPort) : "";
                return (
                  <g key={e.id}>
                    <path d={d} stroke={hot ? "#FF7A7A" : "#2fbf71"} strokeWidth={hot ? 3 : 2.5}
                      strokeDasharray="7 5" fill="none" style={{ pointerEvents: "none" }}>
                      <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
                    </path>
                    {label && (
                      <text x={pa.x + 12} y={pa.y - 7} fill={hot ? "#FF7A7A" : "#7d9c8c"} fontSize="10" style={{ pointerEvents: "none", userSelect: "none" }}>
                        {label.length > 18 ? label.slice(0, 18) + "…" : label}
                      </text>
                    )}
                    {/* wide invisible hit area so wires are easy to hover + click-delete */}
                    <path d={d} stroke="transparent" strokeWidth="14" fill="none"
                      style={{ cursor: "pointer", pointerEvents: "stroke" }}
                      onMouseEnter={() => setHoveredEdge(e.id)} onMouseLeave={() => setHoveredEdge(null)}
                      onClick={(ev) => { ev.stopPropagation(); setEdges((es) => es.filter((x) => x.id !== e.id)); setHoveredEdge(null); markDirty(); }}>
                      <title>Click to delete this connection</title>
                    </path>
                  </g>
                );
              })}
              {connecting && (
                <path d={bez(outPortPos(nodes.find((n) => n.id === connecting.from), connecting.port), { x: connecting.x, y: connecting.y })}
                  stroke="#9be8c0" strokeWidth="2" strokeDasharray="4 4" fill="none" style={{ pointerEvents: "none" }} />
              )}
            </svg>

            {nodes.map((n) => {
              const t = typeInfo(n);
              const selected = sel === n.id;
              const isConnectTarget = connecting && connecting.from !== n.id && n.type !== "welcome";
              return (
                <div key={n.id} data-node-id={n.id}
                  style={{
                    ...S.node, left: n.x, top: n.y, height: nodeH(n),
                    borderColor: isConnectTarget ? "#9be8c0" : selected ? t.color : "#1d3328",
                    boxShadow: selected ? `0 0 0 2px ${t.color}55, 0 10px 24px rgba(0,0,0,.45)` : "0 8px 20px rgba(0,0,0,.35)",
                    cursor: isConnectTarget ? "crosshair" : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connecting) { connectTo(n.id); return; }
                    setSel(n.id);
                  }}>
                  <div style={{ ...S.nodeHeader, background: t.color + "22", color: t.color }} onPointerDown={(e) => { if (!connecting) startDrag(e, n); }}>
                    <span>{t.icon} {t.label}</span>
                    {n.type === "welcome" && <span style={S.entryBadge}>ENTRY</span>}
                  </div>
                  <div style={S.nodeBody}>
                    <Trunc text={nodeSummary(n)} />
                    {menuLikeTypes.has(n.type) && (n.config.options || []).map((o, i) => (
                      <div key={i} style={S.menuRow}>{i + 1}. {o.length > 20 ? o.slice(0, 20) + "…" : o}</div>
                    ))}
                    {n.type === "csat" && [1, 2, 3, 4, 5].map((o, i) => (
                      <div key={i} style={S.menuRow}>{o}. rating branch</div>
                    ))}
                    {branchLabels[n.type] && !menuLikeTypes.has(n.type) && n.type !== "csat" && branchLabels[n.type].map((o, i) => (
                      <div key={i} style={S.menuRow}>{i + 1}. {o}</div>
                    ))}
                    {n.type === "collect" && <span style={S.chip}>saves → {"{" + n.config.field + "}"}</span>}
                    {n.type === "catalog" && (n.config.items || []).map((o, i) => (
                      <div key={i} style={S.menuRow}>{i + 1}. {(o.name || "Item").length > 20 ? o.name.slice(0, 20) + "…" : o.name}</div>
                    ))}
                    {n.type === "custom" && customSteps(n).slice(0, 8).map((s, i) => (
                      <div key={i} style={S.menuRow}>{STEP_KINDS[s.kind]?.icon} {stepSummary(s).length > 22 ? stepSummary(s).slice(0, 22) + "…" : stepSummary(s)}</div>
                    ))}
                  </div>
                  {n.type !== "welcome" && (
                    <div style={{
                      ...S.port, left: -7, top: 11,
                      background: isConnectTarget ? "#9be8c0" : "#5c8a72",
                      boxShadow: isConnectTarget ? "0 0 0 4px #9be8c044" : "none",
                      transform: isConnectTarget ? "scale(1.3)" : "none",
                    }}
                      onClick={(e) => { e.stopPropagation(); connectTo(n.id); }} title="input — drop or click a wire here" />
                  )}
                  {Array.from({ length: outputCount(n) }).map((_, i) => (
                    <div key={i}
                      style={{
                        ...S.port, right: -7, top: outPortPos(n, i).y - n.y - 7, background: t.color,
                        boxShadow: connecting?.from === n.id && connecting?.port === i ? `0 0 0 4px ${t.color}55` : "none",
                      }}
                      onPointerDown={(e) => startConnect(e, n, i)}
                      title={outputCount(n) > 1 ? `drag to connect · ${portLabel(n, i)}` : "drag to connect"} />
                  ))}
                </div>
              );
            })}
            {!hasWelcome && <div style={S.warnFloat}>⚠️ Add a Welcome block — it's the bot's entry point.</div>}
            {isMobile && (
              <button style={S.fab} onClick={() => setShowPalette(true)}>🧱 Blocks</button>
            )}
          </div>

          <div style={isMobile ? { ...S.inspector, ...S.inspectorSheet, ...(selNode ? {} : { display: "none" }) } : S.inspector}>
            {isMobile && selNode && (
              <button style={{ ...S.ghostBtn, width: "100%", marginBottom: 10 }} onClick={() => setSel(null)}>✓ Done</button>
            )}
            <div style={S.paneTitle}>Block settings</div>
            {!selNode && <div style={{ fontSize: 12, color: "#7d9c8c" }}>Select a block on the canvas to edit its text and behavior.</div>}
            {selNode && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: typeInfo(selNode).color, marginBottom: 10 }}>
                  {typeInfo(selNode).icon} {typeInfo(selNode).label}
                </div>

                {selNode.type === "custom" && (<>
                  <Field label="Block name">
                    <input style={S.input} value={selNode.config.label || ""}
                      onChange={(e) => updateConfig(selNode.id, { label: e.target.value })} />
                  </Field>
                  <Field label="Steps (run in order)">
                    <StepsEditor steps={customSteps(selNode)} onChange={(steps) => updateConfig(selNode.id, { steps })} />
                  </Field>
                  <div style={{ fontSize: 11, color: "#7d9c8c" }}>
                    A Choices step must be last — each choice becomes an output dot. Edits here change only this copy, not your saved block.
                  </div>
                </>)}

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

                {menuLikeTypes.has(selNode.type) && (<>
                  <Field label="Prompt">
                    <textarea style={S.textarea} rows={2} value={selNode.config.prompt}
                      onChange={(e) => updateConfig(selNode.id, { prompt: e.target.value })} />
                  </Field>
                  <Field label="Options (each gets its own output dot)">
                    {(selNode.config.options || []).map((o, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input style={{ ...S.input, flex: 1 }} value={o}
                          onChange={(e) => {
                            const options = [...selNode.config.options];
                            options[i] = e.target.value;
                            updateConfig(selNode.id, { options });
                          }} />
                        <button style={S.miniBtn} title="Remove option" onClick={() => removeOption(selNode, i)}>✕</button>
                      </div>
                    ))}
                    {(selNode.config.options || []).length < 6 && (
                      <button style={S.addBtn} onClick={() => updateConfig(selNode.id, { options: [...(selNode.config.options || []), "New option"] })}>+ Add option</button>
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

                {!["welcome", "goodbye", "collect", "faq", "custom"].includes(selNode.type) && !menuLikeTypes.has(selNode.type) && (
                  <GenericConfig node={selNode} updateConfig={updateConfig} />
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
              <button style={S.ghostBtn} onClick={copyCode}>Copy server.js</button>
              <button style={S.primaryBtn} onClick={downloadZip}>📦 Download full code (ZIP)</button>
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
                      <li>In API Setup, add your personal WhatsApp number as a recipient, then message the test number — the bot will reply. 🎉</li>
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
                  {activated ? "online · live webhook" : botId ? "test mode · backend engine" : "save the flow to test"}
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
                placeholder={botId ? "Type a message…" : "Save the flow first"}
                disabled={!botId} value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()} />
              <button style={{ ...S.primaryBtn, borderRadius: 20, padding: "8px 16px", opacity: botId ? 1 : 0.45 }} disabled={!botId} onClick={sendChat}>➤</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Block Lab: step editor (shared by lab modal + inspector) ---------- */
function StepsEditor({ steps, onChange }) {
  const S = styles;
  const patch = (i, p) => onChange(steps.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const hasChoice = steps.some((s) => s.kind === "choice");
  return (
    <div>
      {steps.map((s, i) => (
        <div key={i} style={{ marginBottom: 8, padding: 8, background: "#0d1b13", borderRadius: 8, border: "1px solid #1d3328" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#9be8c0", flex: 1 }}>
              {i + 1}. {STEP_KINDS[s.kind]?.icon} {STEP_KINDS[s.kind]?.label}
            </span>
            <button style={S.miniBtn} title="Move up" onClick={() => move(i, -1)}>↑</button>
            <button style={S.miniBtn} title="Move down" onClick={() => move(i, 1)}>↓</button>
            <button style={{ ...S.miniBtn, color: "#FF7A7A" }} title="Remove step" onClick={() => onChange(steps.filter((_, j) => j !== i))}>✕</button>
          </div>
          {s.kind === "say" && (
            <textarea style={S.textarea} rows={2} value={s.message} placeholder="Message to send — {vars} allowed"
              onChange={(e) => patch(i, { message: e.target.value })} />
          )}
          {s.kind === "ask" && (<>
            <textarea style={{ ...S.textarea, marginBottom: 6 }} rows={2} value={s.question} placeholder="Question to ask"
              onChange={(e) => patch(i, { question: e.target.value })} />
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input style={{ ...S.input, flex: 1 }} value={s.field} placeholder="save as variable"
                onChange={(e) => patch(i, { field: e.target.value.replace(/\W/g, "") })} />
              <select style={{ ...S.input, width: 110 }} value={s.validate || "text"}
                onChange={(e) => patch(i, { validate: e.target.value })}>
                <option value="text">any text</option>
                <option value="number">number</option>
                <option value="email">email</option>
                <option value="phone">phone</option>
              </select>
            </div>
            <input style={S.input} value={s.ack || ""} placeholder={"reply after saving (optional) — e.g. Got it, {" + (s.field || "value") + "}!"}
              onChange={(e) => patch(i, { ack: e.target.value })} />
          </>)}
          {s.kind === "set" && (
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ ...S.input, flex: 1 }} value={s.field} placeholder="variable"
                onChange={(e) => patch(i, { field: e.target.value.replace(/\W/g, "") })} />
              <input style={{ ...S.input, flex: 1 }} value={s.value} placeholder="value"
                onChange={(e) => patch(i, { value: e.target.value })} />
            </div>
          )}
          {s.kind === "choice" && (<>
            <input style={{ ...S.input, marginBottom: 6 }} value={s.prompt} placeholder="Prompt"
              onChange={(e) => patch(i, { prompt: e.target.value })} />
            {(s.options || []).map((o, oi) => (
              <div key={oi} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input style={{ ...S.input, flex: 1 }} value={o}
                  onChange={(e) => patch(i, { options: s.options.map((x, xj) => (xj === oi ? e.target.value : x)) })} />
                {s.options.length > 1 && (
                  <button style={S.miniBtn} onClick={() => patch(i, { options: s.options.filter((_, xj) => xj !== oi) })}>✕</button>
                )}
              </div>
            ))}
            {(s.options || []).length < 8 && (
              <button style={S.addBtn} onClick={() => patch(i, { options: [...(s.options || []), "New option"] })}>+ Add option</button>
            )}
            <div style={{ fontSize: 10.5, color: "#7d9c8c", marginTop: 4 }}>Each option becomes an output dot on the block.</div>
          </>)}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {Object.entries(STEP_KINDS).map(([kind, meta]) => (
          <button key={kind} style={{ ...styles.miniBtn, opacity: kind === "choice" && hasChoice ? 0.4 : 1 }}
            disabled={kind === "choice" && hasChoice}
            onClick={() => onChange([...steps.filter((s) => s.kind !== "choice"), stepDefaults[kind](), ...steps.filter((s) => s.kind === "choice")])}>
            + {meta.icon} {meta.label}
          </button>
        ))}
      </div>
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
function GenericConfig({ node, updateConfig }) {
  const patch = (key, value) => updateConfig(node.id, { [key]: value });
  return (
    <>
      {Object.entries(node.config || {}).map(([key, value]) => (
        <Field key={key} label={key.replace(/([A-Z])/g, " $1")}>
          {Array.isArray(value) ? (
            <ArrayEditor value={value} onChange={(next) => patch(key, next)} />
          ) : typeof value === "number" ? (
            <input style={styles.input} type="number" value={value} onChange={(e) => patch(key, Number(e.target.value))} />
          ) : longField(key, value) ? (
            <textarea style={styles.textarea} rows={3} value={value}
              onChange={(e) => patch(key, e.target.value)} />
          ) : (
            <input style={styles.input} value={value}
              onChange={(e) => patch(key, e.target.value)} />
          )}
        </Field>
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
        <div key={idx} style={{ marginBottom: 8, padding: 8, background: "#0d1b13", borderRadius: 8, border: "1px solid #1d3328" }}>
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

/* ---------- styles ---------- */
const mono = "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace";
const styles = {
  app: { height: "100vh", display: "flex", flexDirection: "column", background: "#0a120d", color: "#e6f4ec", fontFamily: "'Sora','Segoe UI',system-ui,sans-serif", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "10px 16px", borderBottom: "1px solid #16281e", background: "#0c1610" },
  logo: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 18px #25d36644" },
  tab: { padding: "8px 14px", borderRadius: 8, border: "1px solid #1d3328", background: "transparent", color: "#8fae9d", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  tabActive: { background: "#25D366", borderColor: "#25D366", color: "#06130b" },
  toast: { position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 99, padding: "8px 18px", borderRadius: 10, border: "1px solid", fontSize: 13, fontWeight: 700 },
  overlay: { position: "fixed", inset: 0, zIndex: 90, background: "rgba(4,10,7,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  labCard: { width: 560, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", background: "#0c1610", border: "1px solid #2a4535", borderRadius: 16, padding: 20, boxShadow: "0 24px 60px rgba(0,0,0,.6)" },

  designWrap: { flex: 1, display: "flex", minHeight: 0 },
  palette: { width: 230, padding: 14, borderRight: "1px solid #16281e", overflowY: "auto", background: "#0c1610", flexShrink: 0 },
  paneTitle: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#9be8c0", marginBottom: 8 },
  paletteItem: { display: "flex", gap: 10, alignItems: "flex-start", width: "100%", textAlign: "left", padding: 10, marginBottom: 8, borderRadius: 10, border: "1px solid #1d3328", background: "#0d1b13", cursor: "pointer", color: "inherit", fontFamily: "inherit" },
  tipBox: { marginTop: 10, padding: 10, fontSize: 11, color: "#8fae9d", background: "#0d1b13", border: "1px dashed #2a4535", borderRadius: 10, lineHeight: 1.5 },

  // canvas pans with touch; nodes set touchAction:none so dragging them doesn't scroll
  canvas: { flex: 1, position: "relative", overflow: "auto", backgroundImage: "radial-gradient(#1a2f22 1.2px, transparent 1.2px)", backgroundSize: "22px 22px", backgroundColor: "#0a120d", touchAction: "pan-x pan-y", WebkitOverflowScrolling: "touch" },
  svg: { position: "absolute", top: 0, left: 0, pointerEvents: "none" },

  node: { position: "absolute", width: NODE_W, background: "#0f1d14", border: "1.5px solid #1d3328", borderRadius: 12, userSelect: "none", touchAction: "none" },
  nodeHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", fontSize: 12, fontWeight: 800, borderRadius: "10px 10px 0 0", cursor: "grab" },
  entryBadge: { fontSize: 9, fontWeight: 800, background: "#25D366", color: "#06130b", padding: "1px 6px", borderRadius: 6 },
  nodeBody: { padding: "8px 10px" },
  menuRow: { fontSize: 11, color: "#e6f4ec", background: "#14261a", borderRadius: 6, padding: "3px 8px", marginTop: 5 },
  chip: { display: "inline-block", marginTop: 6, fontSize: 10, fontFamily: mono, color: "#B983FF", background: "#B983FF1a", padding: "2px 8px", borderRadius: 6 },
  port: { position: "absolute", width: 14, height: 14, borderRadius: "50%", border: "2.5px solid #0a120d", cursor: "crosshair", zIndex: 5 },
  warnFloat: { position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "#3a2a10", border: "1px solid #F5B841", color: "#F5B841", fontSize: 12, padding: "6px 14px", borderRadius: 8 },

  inspector: { width: 260, padding: 14, borderLeft: "1px solid #16281e", overflowY: "auto", background: "#0c1610", flexShrink: 0 },

  /* mobile: palette slides in from the left, inspector rises as a bottom sheet */
  paletteDrawer: { position: "fixed", top: 0, left: 0, bottom: 0, width: "min(320px, 85vw)", zIndex: 70, borderRight: "1px solid #2a4535", boxShadow: "12px 0 40px rgba(0,0,0,.55)" },
  drawerBackdrop: { position: "fixed", inset: 0, zIndex: 65, background: "rgba(4,10,7,.6)" },
  inspectorSheet: { position: "fixed", left: 0, right: 0, bottom: 0, width: "auto", maxHeight: "58vh", zIndex: 60, borderLeft: "none", borderTop: "1px solid #2a4535", borderRadius: "16px 16px 0 0", boxShadow: "0 -12px 40px rgba(0,0,0,.55)" },
  fab: { position: "fixed", bottom: 16, left: 16, zIndex: 40, padding: "12px 18px", fontSize: 14, fontWeight: 800, borderRadius: 999, border: "none", background: "#25D366", color: "#06130b", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(0,0,0,.5)" },
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

  phone: { width: 340, maxWidth: "100%", height: "min(560px, calc(100dvh - 180px))", minHeight: 380, display: "flex", flexDirection: "column", background: "#0c1610", border: "1px solid #16281e", borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.5)" },
  phoneHeader: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#128C7E22", borderBottom: "1px solid #16281e" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  phoneBody: { flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 7, backgroundImage: "radial-gradient(#14261a 1px, transparent 1px)", backgroundSize: "16px 16px" },
  bubble: { maxWidth: "80%", padding: "8px 11px", borderRadius: 12, fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  bubbleBot: { background: "#14261a", border: "1px solid #1d3328", borderTopLeftRadius: 3 },
  bubbleMe: { background: "#128C7E", color: "#eafff5", borderTopRightRadius: 3 },
  phoneInput: { display: "flex", gap: 8, padding: 10, borderTop: "1px solid #16281e" },
};
