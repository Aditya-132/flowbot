// ============================================================
// AI Builder assistant — turns a natural-language description into
// a FlowBot flowchart (nodes + edges JSON), inventing Block Lab
// custom blocks when no built-in block fits. Runs on the requesting
// user's OWN LLM API key (BYOK) — the key is never stored.
// The bot runtime stays deterministic; AI is builder-side only.
// ============================================================

const ALLOWED_TYPES = new Set([
  "welcome", "menu", "faq", "collect", "goodbye", "text", "quick_reply", "link", "image",
  "coupon", "product_card", "catalog", "product_search", "order_status", "tracking_link",
  "appointment", "booking_confirm", "lead_qualify", "collect_email", "collect_phone",
  "collect_address", "csat", "feedback", "language", "business_hours", "human_handoff",
  "tag_customer", "set_variable", "condition", "save_note", "payment_link", "return_policy",
  "shipping_info", "abandoned_cart", "review_request", "collect_number", "location",
  "contact_card", "http_request", "ai_reply", "custom",
]);

const STEP_KINDS = new Set(["say", "ask", "set", "api", "ai", "choice"]);

const CATALOG = `
welcome{message} — entry point, exactly ONE per flow, cannot receive edges
text{message} · goodbye{message} (ends conversation, 0 outputs) · human_handoff{message}
menu{prompt,options[2-6]} · quick_reply{prompt,options} · lead_qualify{prompt,options} · language{prompt,options} — one output port per option
faq{pairs:[{k:"keyword",a:"answer"}]} — keyword Q&A loop, customer types 0 to continue (1 output)
collect{question,field} · collect_email{question} · collect_phone{question} · collect_address{question} · collect_number{question,field,ack} — save reply as {field}
order_status{question,ack} (saves {orderId}) · tracking_link{question,baseUrl,ack} (saves {trackingId}) · appointment{question,ack} (saves {appointmentTime}) · feedback{question,ack} (saves {feedback})
booking_confirm{message} · coupon{message,code} · payment_link{message,url} · link{message,url} · image{caption,url}
product_card{name,price,description,link} · catalog{title,items:[{name,price}]}
product_search{question,notFound,items:[{name,keywords,price,description,link}]} — 2 outputs: 0=found, 1=not found
csat{question,field,thanks} — 5 outputs (ratings 1-5; wire at least port 0)
business_hours{startHour,endHour,openMessage,closedMessage} — 2 outputs: 0=open, 1=closed
condition{field,operator:"equals"|"contains",value,trueMessage,falseMessage} — 2 outputs: 0=true, 1=false
set_variable{field,value,message} · tag_customer{tag,message} · save_note{field,note,message}
return_policy{message} · shipping_info{message} · abandoned_cart{message} · review_request{message}
location{title,address,mapsUrl} · contact_card{title,phone,email,website}
http_request{method:"GET|POST|PUT|PATCH|DELETE",url,headers:[{key,value}],body,saveAs,jsonPath,successMessage,errorMessage} — calls any API, 2 outputs: 0=success, 1=error; response saved as {saveAs}
ai_reply{greeting,context,provider:"anthropic|openai|gemini",apiKey:"",model,baseUrl,errorMessage} — AI chat mode until customer types 0 (1 output); needs the OWNER's key, always leave apiKey ""
custom{label,icon:"emoji",color:"#hex",steps:[...]} — invent ANY feature that no built-in block covers. Steps run top to bottom:
  {kind:"say",message} · {kind:"ask",question,field,validate:"text|number|email|phone",ack} · {kind:"set",field,value}
  {kind:"api",method,url,headers:[{key,value}],body,field,jsonPath,errorMessage} · {kind:"ai",provider,apiKey:"",model,context,greeting,errorMessage}
  {kind:"choice",prompt,options[2-8]} — ONLY as the last step; each option becomes an output port`;

const SYSTEM = `You are FlowBot's AI Builder — an expert WhatsApp chatbot flow architect.
The user describes a bot (in any language); you design the complete flowchart.

OUTPUT STRICT JSON ONLY — no markdown, no fences, no commentary outside JSON:
{"reply":"<2-4 friendly sentences in the user's language summarizing what you built and any keys/URLs they must fill in>",
 "flow":{"nodes":[{"id":"n1","type":"...","config":{...}}],"edges":[{"from":"n1","fromPort":0,"to":"n2"}]}}

RULES:
- Exactly one "welcome" node; it is the entry point and can never be an edge target.
- Edges: fromPort = source output index (0-based). Single-output blocks always use fromPort 0. Every output port of menu-like blocks should be wired.
- Node ids: n1, n2, n3… No x/y — layout is automatic.
- Write real, useful message copy in the user's language (not lorem ipsum). Use {variables} saved by collect blocks, e.g. {name}.
- Prefer built-in blocks. When a requested feature has NO built-in block, invent a "custom" block with steps — give it a fitting label, emoji icon and color.
- ai_reply blocks and "ai" steps require the owner's own API key: always set apiKey:"" and remind them in reply.
- http_request/api steps: use the user's real API URLs if given, otherwise a clear placeholder like https://your-api.example.com/orders/{orderId} and say so in reply.
- Keep flows focused: usually 6-25 nodes. Every non-goodbye path should eventually reach a goodbye or loop back via menu.
- If the user asks for changes and a current flow is provided, return the FULL updated flow (all nodes, not a diff).

BLOCK CATALOG:${CATALOG}`;

const PRIVATE_HOST = /^(localhost$|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0$|\[?::1\]?$|172\.(1[6-9]|2\d|3[01])\.)/i;
const DEFAULT_MODELS = { anthropic: "claude-sonnet-5", openai: "gpt-5-mini", gemini: "gemini-3.6-flash" };

async function chatLLM({ provider, apiKey, model, baseUrl }, system, messages) {
  const p = ["anthropic", "openai", "gemini"].includes(provider) ? provider : "anthropic";
  const m = String(model || "").trim() || DEFAULT_MODELS[p];
  let url, headers, body, pick;
  if (p === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" };
    body = { model: m, max_tokens: 8000, system, messages };
    pick = (d) => (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  } else if (p === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`;
    headers = { "x-goog-api-key": apiKey, "content-type": "application/json" };
    body = {
      system_instruction: { parts: [{ text: system }] },
      contents: messages.map((x) => ({ role: x.role === "assistant" ? "model" : "user", parts: [{ text: x.content }] })),
      generationConfig: { maxOutputTokens: 8000 },
    };
    pick = (d) => (d.candidates?.[0]?.content?.parts || []).map((x) => x.text).filter(Boolean).join("\n");
  } else {
    const base = String(baseUrl || "https://api.openai.com").replace(/\/+$/, "");
    url = `${base}/v1/chat/completions`;
    let host;
    try { host = new URL(url).hostname; } catch { throw new Error("invalid base URL"); }
    if (PRIVATE_HOST.test(host) && !process.env.FLOWBOT_ALLOW_PRIVATE_URLS) throw new Error("private addresses are blocked");
    headers = { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" };
    body = { model: m, max_tokens: 8000, messages: [{ role: "system", content: system }, ...messages] };
    pick = (d) => d.choices?.[0]?.message?.content || "";
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`AI provider error HTTP ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ""}`);
    }
    const data = await res.json();
    return String(pick(data) || "");
  } catch (e) {
    if (e.name === "AbortError") throw new Error("AI provider timed out");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Pull the first balanced JSON object out of the model's text (fences tolerated).
function extractJson(text) {
  const t = String(text);
  const start = t.indexOf("{");
  if (start < 0) throw new Error("the model didn't return JSON — try again");
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { if (inStr) esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (!depth) return JSON.parse(t.slice(start, i + 1));
    }
  }
  throw new Error("the model returned incomplete JSON — try again");
}

// Simple layered auto-layout: BFS depth from welcome → columns, siblings → rows.
function layout(nodes, edges) {
  const w = nodes.find((n) => n.type === "welcome");
  const depth = new Map([[w.id, 0]]);
  const q = [w.id];
  while (q.length) {
    const id = q.shift();
    const kids = edges.filter((e) => e.from === id).sort((a, b) => a.fromPort - b.fromPort).map((e) => e.to);
    for (const c of kids) {
      if (!depth.has(c)) {
        depth.set(c, depth.get(id) + 1);
        q.push(c);
      }
    }
  }
  let maxD = 0;
  for (const d of depth.values()) maxD = Math.max(maxD, d);
  const rows = new Map();
  for (const n of nodes) {
    const d = depth.has(n.id) ? depth.get(n.id) : maxD + 1;
    const row = rows.get(d) || 0;
    rows.set(d, row + 1);
    n.x = 60 + d * 300;
    n.y = 60 + row * 190;
  }
}

function sanitizeFlow(raw) {
  if (!raw || !Array.isArray(raw.nodes) || !raw.nodes.length || !Array.isArray(raw.edges))
    throw new Error("the model returned no usable flow — try rephrasing");
  const nodes = [];
  const seen = new Set();
  for (const n of raw.nodes.slice(0, 60)) {
    if (!n || typeof n !== "object") continue;
    const id = String(n.id || `n${nodes.length + 1}`).slice(0, 24);
    const type = String(n.type || "");
    if (seen.has(id) || !ALLOWED_TYPES.has(type)) continue;
    const config = n.config && typeof n.config === "object" && !Array.isArray(n.config) ? n.config : {};
    if (type === "custom") {
      config.steps = (Array.isArray(config.steps) ? config.steps : []).filter(
        (s) => s && typeof s === "object" && STEP_KINDS.has(s.kind)
      ).slice(0, 30);
      // choice steps are only supported as the last step
      config.steps = config.steps.filter((s, i) => s.kind !== "choice" || i === config.steps.length - 1);
      if (!config.steps.length) continue;
    }
    // never let the model smuggle in a key
    if (type === "ai_reply") config.apiKey = "";
    if (type === "custom") for (const s of config.steps) if (s.kind === "ai") s.apiKey = "";
    seen.add(id);
    nodes.push({ id, type, config });
  }
  const welcomes = nodes.filter((n) => n.type === "welcome");
  if (!welcomes.length) throw new Error("the generated flow has no Welcome block — try again");
  const keep = nodes.filter((n) => n.type !== "welcome" || n.id === welcomes[0].id);
  const ids = new Set(keep.map((n) => n.id));
  const byId = Object.fromEntries(keep.map((n) => [n.id, n]));
  const edges = [];
  const usedPorts = new Set();
  for (const e of raw.edges.slice(0, 200)) {
    if (!e || !ids.has(e.from) || !ids.has(e.to) || e.from === e.to) continue;
    if (byId[e.to].type === "welcome") continue;
    const fromPort = Number.isInteger(e.fromPort) && e.fromPort >= 0 && e.fromPort < 8 ? e.fromPort : 0;
    const key = `${e.from}|${fromPort}`;
    if (usedPorts.has(key)) continue; // one wire per output port
    usedPorts.add(key);
    edges.push({ id: `e${edges.length + 1}`, from: e.from, fromPort, to: e.to });
  }
  layout(keep, edges);
  return { nodes: keep, edges };
}

async function generateFlow(cfg, message, history, currentFlow) {
  const msgs = [
    ...history
      .filter((h) => h && typeof h.content === "string" && ["user", "assistant"].includes(h.role))
      .map((h) => ({ role: h.role, content: String(h.content).slice(0, 2000) })),
    {
      role: "user",
      content:
        currentFlow && Array.isArray(currentFlow.nodes) && currentFlow.nodes.length
          ? `CURRENT FLOW (update this):\n${JSON.stringify({
              nodes: currentFlow.nodes.slice(0, 60).map(({ id, type, config }) => ({ id, type, config })),
              edges: (currentFlow.edges || []).slice(0, 200).map(({ from, fromPort, to }) => ({ from, fromPort, to })),
            })}\n\nREQUEST: ${message}`
          : message,
    },
  ];
  const text = await chatLLM(cfg, SYSTEM, msgs);
  const data = extractJson(text);
  const flow = sanitizeFlow(data.flow);
  return { reply: String(data.reply || "Done — your flow is on the canvas!").slice(0, 1200), flow };
}

module.exports = { generateFlow };
