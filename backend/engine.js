// ============================================================
// FlowBot Engine — deterministic flowchart interpreter.
// NO AI anywhere. Used by live webhooks, simulator, and codegen.
// ============================================================

// Unresolved {vars} stay visible as {var} — clearer than silently printing the key.
const interp = (msg, vars) => String(msg || "").replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

const menuTypes = new Set(["menu", "quick_reply", "language", "lead_qualify", "interactive_list"]);
const collectConfig = {
  collect: { field: "field", question: "question", ack: "Got it." },
  collect_number: { field: "field", question: "Please share a number:", ack: "Got it." },
  collect_email: { fixedField: "email", question: "question", ack: "Thanks, I saved your email." },
  collect_phone: { fixedField: "phone", question: "question", ack: "Thanks, I saved your phone number." },
  collect_address: { fixedField: "address", question: "question", ack: "Thanks, I saved your address." },
  order_status: { fixedField: "orderId", question: "question", ack: "Thanks. Checking order {orderId}." },
  tracking_link: { fixedField: "trackingId", question: "question", ack: "Tracking link: {baseUrl}{trackingId}" },
  appointment: { fixedField: "appointmentTime", question: "question", ack: "Appointment request saved for {appointmentTime}." },
  feedback: { fixedField: "feedback", question: "question", ack: "Thanks for the feedback." },
};

/* ---------- HTTP Request (GET/POST/PUT/PATCH/DELETE) ----------
   Calls an external API mid-flow with {vars} interpolated into the URL,
   headers and body, then stores the response (optionally narrowed by a
   dot json-path) in a session variable. Used by the http_request block
   and the "api" step kind inside user-made custom blocks.
   Private/loopback hosts are blocked unless FLOWBOT_ALLOW_PRIVATE_URLS
   is set (exported bots calling their own local APIs can opt in). */

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const PRIVATE_HOST = /^(localhost$|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0$|\[?::1\]?$|172\.(1[6-9]|2\d|3[01])\.)/i;

function jsonPathPick(obj, path) {
  return String(path).split(".").filter(Boolean).reduce((a, k) => (a == null ? undefined : a[k]), obj);
}

async function httpRequest(c, vars) {
  const method = HTTP_METHODS.has(String(c.method || "").toUpperCase()) ? String(c.method).toUpperCase() : "GET";
  const url = interp(c.url || "", vars);
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: "URL must start with http(s)://" };
  let host;
  try { host = new URL(url).hostname; } catch { return { ok: false, error: "invalid URL" }; }
  if (PRIVATE_HOST.test(host) && !process.env.FLOWBOT_ALLOW_PRIVATE_URLS)
    return { ok: false, error: "private addresses are blocked" };
  const headers = {};
  for (const h of Array.isArray(c.headers) ? c.headers : []) {
    if (h && h.key) headers[interp(h.key, vars)] = interp(h.value ?? "", vars);
  }
  const body = method !== "GET" && c.body ? interp(c.body, vars) : undefined;
  if (body && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type"))
    headers["Content-Type"] = "application/json";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { method, headers, body, signal: ctrl.signal });
    const text = (await res.text()).slice(0, 65536);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    let value = text;
    try {
      const parsed = JSON.parse(text);
      const picked = c.jsonPath ? jsonPathPick(parsed, c.jsonPath) : parsed;
      value = picked === undefined ? "" : typeof picked === "object" ? JSON.stringify(picked) : String(picked);
    } catch { /* not JSON — keep the raw text */ }
    // WhatsApp message bodies cap out near 4096 chars — keep stored values safe to echo
    return { ok: true, value: String(value).slice(0, 3500) };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "timeout" : "network error" };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- AI Reply block (BYOK — bring your own key) ----------
   Optional and off by default: the deterministic flow is untouched unless the
   owner drops an AI Reply block AND pastes their own provider API key. When a
   customer reaches the block, every message is answered by the owner's chosen
   LLM (with the owner's business context as the system prompt) until the
   customer types 0 to continue the flow. Keys are used server-side only. */

const AI_PROVIDERS = new Set(["anthropic", "openai", "gemini"]);
const AI_DEFAULT_MODELS = { anthropic: "claude-haiku-4-5", openai: "gpt-4o-mini", gemini: "gemini-2.5-flash" };

async function aiReply(c, history, userText, vars) {
  const provider = AI_PROVIDERS.has(c.provider) ? c.provider : "anthropic";
  const apiKey = String(c.apiKey || "").trim();
  if (!apiKey) return { ok: false, error: "no API key configured" };
  const model = String(c.model || "").trim() || AI_DEFAULT_MODELS[provider];
  const system = interp(
    c.context || "You are a helpful WhatsApp assistant for a business. Keep replies short, friendly and factual. If you are not sure, say a human teammate will follow up.",
    vars
  );
  const msgs = [...history.slice(-10), { role: "user", content: String(userText).slice(0, 2000) }];
  let url, headers, body, pick;
  if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" };
    body = { model, max_tokens: 500, system, messages: msgs };
    pick = (d) => (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  } else if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    headers = { "x-goog-api-key": apiKey, "content-type": "application/json" };
    body = {
      system_instruction: { parts: [{ text: system }] },
      contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 500 },
    };
    pick = (d) => (d.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join("\n");
  } else {
    // OpenAI or any OpenAI-compatible provider (Groq, OpenRouter, Mistral…) via baseUrl
    const base = String(c.baseUrl || "https://api.openai.com").replace(/\/+$/, "");
    url = `${base}/v1/chat/completions`;
    let host;
    try { host = new URL(url).hostname; } catch { return { ok: false, error: "invalid base URL" }; }
    if (PRIVATE_HOST.test(host) && !process.env.FLOWBOT_ALLOW_PRIVATE_URLS)
      return { ok: false, error: "private addresses are blocked" };
    headers = { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" };
    body = { model, max_tokens: 500, messages: [{ role: "system", content: system }, ...msgs] };
    pick = (d) => d.choices?.[0]?.message?.content || "";
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const text = String(pick(data) || "").trim();
    return text ? { ok: true, text: text.slice(0, 3500) } : { ok: false, error: "empty reply" };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "timeout" : "network error" };
  } finally {
    clearTimeout(timer);
  }
}

function firstEdge(flow, id, port) {
  return flow.edges.find((x) => x.from === id && x.fromPort === port);
}

function getNext(flow, byId, id, port) {
  const e = firstEdge(flow, id, port);
  return e ? byId[e.to] : null;
}

function fieldName(node) {
  const meta = collectConfig[node.type];
  if (meta?.fixedField) return meta.fixedField;
  return node.config.field || "value";
}

/* ---------- auto-collect for missing variables ----------
   If a block is about to show a {var} nobody collected yet, the bot
   first asks for it, saves the answer, then re-runs the block. */
const SCAN_KEYS = ["message", "prompt", "question", "caption", "title", "openMessage", "closedMessage", "trueMessage", "falseMessage", "url", "code", "note", "value", "body"];

const prettyVar = (k) =>
  String(k).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

const askFor = (k) => `Before we continue — please share your ${prettyVar(k)}:`;

function missingVar(node, vars) {
  const c = node.config || {};
  // vars this block fills in by itself — never ask the user for these
  const own = new Set();
  if (collectConfig[node.type]) own.add(fieldName(node));
  if (node.type === "csat") own.add(c.field || "rating");
  if (node.type === "set_variable") own.add(c.field || "value");
  if (node.type === "save_note") own.add(c.field || "note");
  if (node.type === "http_request") {
    own.add(c.saveAs || "apiResult").add((c.saveAs || "apiResult") + "_error");
  }
  if (menuTypes.has(node.type)) {
    own.add("choice").add(`${node.type}_choice`);
    if (node.type === "language") own.add("language");
  }
  for (const key of SCAN_KEYS) {
    const s = c[key];
    if (typeof s !== "string") continue;
    for (const m of s.matchAll(/\{(\w+)\}/g)) {
      const k = m[1];
      if (vars[k] === undefined && c[k] === undefined && !own.has(k)) return k;
    }
  }
  // a condition on a variable nobody set yet should ask, not silently branch false
  if (node.type === "condition") {
    const f = c.field || "value";
    if (vars[f] === undefined && !own.has(f)) return f;
  }
  // custom blocks: auto-collect {vars} referenced by steps that no step in the
  // block ever provides itself — same convenience plain blocks already get, so
  // {name} & co. get asked up front instead of printing literally (or being
  // pulled in confusingly by a later plain block).
  if (node.type === "custom" && Array.isArray(c.steps)) {
    const provided = new Set();
    for (const s of c.steps) {
      if (s.kind === "ask" || s.kind === "set") provided.add(s.field || "value");
      if (s.kind === "api") provided.add(s.field || "apiResult").add((s.field || "apiResult") + "_error");
    }
    const STEP_SCAN = ["message", "question", "value", "url", "body", "prompt", "successMessage", "errorMessage", "greeting", "context", "ack"];
    const scan = (str) => {
      if (typeof str !== "string") return null;
      for (const m of str.matchAll(/\{(\w+)\}/g)) if (vars[m[1]] === undefined && !provided.has(m[1])) return m[1];
      return null;
    };
    for (const s of c.steps) {
      for (const key of STEP_SCAN) { const hit = scan(s[key]); if (hit) return hit; }
      if (Array.isArray(s.options)) for (const o of s.options) { const hit = scan(o); if (hit) return hit; }
      if (Array.isArray(s.headers)) for (const h of s.headers) { const hit = scan(h?.key) || scan(h?.value); if (hit) return hit; }
    }
  }
  return null;
}

/* ---------- user-made custom blocks ----------
   A custom block is a list of deterministic steps stored in its config:
     { kind: "say",    message }
     { kind: "set",    field, value }
     { kind: "ask",    question, field, validate: text|number|email|phone, ack? }
     { kind: "api",    method, url, headers[], body, field, jsonPath, errorMessage }
     { kind: "ai",     provider, apiKey, model, baseUrl, context, greeting, errorMessage }
     { kind: "choice", prompt, options[] }  → branches to output port = option index
   Steps run in order; ask/ai/choice pause for the user's reply (ai chats
   until the customer types 0, then the remaining steps continue). */

async function runCustomSteps(node, session, out, startIdx, interpFn, optionPromptFn) {
  const steps = (node.config && Array.isArray(node.config.steps) ? node.config.steps : []);
  for (let i = startIdx; i < steps.length; i++) {
    const s = steps[i] || {};
    if (s.kind === "say") {
      out.push(interpFn(s.message, session.vars));
    } else if (s.kind === "set") {
      session.vars[s.field || "value"] = interpFn(s.value || "", session.vars);
    } else if (s.kind === "api") {
      const r = await httpRequest(s, session.vars);
      const field = s.field || "apiResult";
      if (r.ok) {
        session.vars[field] = r.value;
        if (s.successMessage) out.push(interpFn(s.successMessage, session.vars));
      } else {
        session.vars[field + "_error"] = r.error;
        out.push(interpFn(s.errorMessage || "Sorry, I couldn't fetch that right now.", session.vars));
      }
    } else if (s.kind === "ask") {
      out.push(interpFn(s.question || "Please share:", session.vars));
      session.state = `step|${node.id}|${i}`;
      return true; // waiting for the user's answer
    } else if (s.kind === "ai") {
      out.push(interpFn(s.greeting || "🤖 You're chatting with our AI assistant now. Ask anything — type 0 to continue.", session.vars));
      session.state = `step|${node.id}|${i}`;
      return true; // AI chat mode until the customer types 0
    } else if (s.kind === "choice") {
      out.push(optionPromptFn({ prompt: s.prompt, options: s.options }, session.vars));
      session.state = `step|${node.id}|${i}`;
      return true;
    }
  }
  return false; // ran to the end without pausing
}

const ASK_VALIDATORS = {
  number: (t) => {
    const m = t.match(/\d+/);
    return m ? { value: m[0] } : { error: "Please reply with a number (e.g. 2)." };
  },
  email: (t) =>
    /^\S+@\S+\.\S+$/.test(t) ? { value: t } : { error: "That doesn't look like a valid email — please try again (e.g. name@example.com)." },
  phone: (t) =>
    t.replace(/\D/g, "").length >= 7 ? { value: t } : { error: "That doesn't look like a valid phone number — please send your full number." },
};

function optionPrompt(c, vars, fallback = "Choose an option") {
  const options = c.options || [];
  const lines = options.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return `${interp(c.prompt || fallback, vars)}\n\n${lines}\n\nReply with a number.`;
}

function catalogText(c, vars) {
  const items = c.items || [];
  const lines = items.map((p, i) => {
    const price = p.price ? ` — ${interp(p.price, vars)}` : "";
    return `${i + 1}. ${interp(p.name, vars)}${price}`;
  });
  return `${interp(c.title || "Catalog", vars)}\n\n${lines.join("\n")}`;
}

function productText(c, vars) {
  const parts = [
    interp(c.name || "Product", vars),
    c.price ? `Price: ${interp(c.price, vars)}` : "",
    c.description ? interp(c.description, vars) : "",
    c.link ? interp(c.link, vars) : "",
  ].filter(Boolean);
  return parts.join("\n");
}

function isOpenNow(c) {
  const now = new Date();
  const hour = now.getHours();
  const start = Number(c.startHour ?? 9);
  const end = Number(c.endHour ?? 18);
  if (start === end) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

/**
 * Handle one incoming message against a flow.
 * Async because http_request blocks / api steps call external APIs mid-flow.
 * @param {object} flow     {nodes:[{id,type,config}], edges:[{from,fromPort,to}]}
 * @param {string} text     incoming message body
 * @param {object} session  mutable {state, vars}
 * @param {string[]} [trace]  optional — collects the id of every block executed
 * @returns {Promise<string[]>}  bot replies
 */
async function handleMessage(flow, text, session, trace) {
  // drop empty strings so optional messages (blank condition/hours text) never
  // reach the provider — WhatsApp APIs reject empty bodies
  const replies = (await processMessage(flow, text, session, trace)).map((r) => String(r ?? "").trim()).filter(Boolean);
  // never leave the customer on silence when a branch dead-ends
  if (!replies.length) replies.push("✅ That's all for now. Send any message to start over.");
  return replies;
}

async function processMessage(flow, text, session, trace) {
  const out = [];
  const byId = Object.fromEntries(flow.nodes.map((n) => [n.id, n]));
  const next = (id, port) => getNext(flow, byId, id, port);

  async function continueOrEnd(node, port = 0) {
    const nx = next(node.id, port);
    if (nx) await runFrom(nx);
    else session.state = null;
  }

  async function runFrom(node) {
    let cur = node;
    let guard = 0;
    while (cur && guard++ < 80) {
      const c = cur.config || {};
      if (trace) trace.push(cur.id);

      const need = missingVar(cur, session.vars);
      if (need) {
        out.push(askFor(need));
        session.state = `ask|${cur.id}|${need}`;
        return;
      }

      if (menuTypes.has(cur.type)) {
        out.push(optionPrompt(c, session.vars, "Choose an option"));
        session.state = cur.id;
        return;
      }

      if (collectConfig[cur.type]) {
        out.push(interp(c.question || collectConfig[cur.type].question || "Please share the details:", session.vars));
        session.state = cur.id;
        return;
      }

      switch (cur.type) {
        case "welcome":
        case "text":
        case "return_policy":
        case "shipping_info":
        case "review_request":
        case "abandoned_cart":
        case "booking_confirm":
          out.push(interp(c.message, session.vars));
          cur = next(cur.id, 0);
          break;

        case "faq": {
          const kws = (c.pairs || []).map((p) => `"${p.k}"`).join(", ");
          out.push(`Ask me anything — try keywords like ${kws}.\nType 0 when you're done.`);
          session.state = cur.id;
          return;
        }

        case "link":
          out.push(`${interp(c.message || "Open this link:", session.vars)}\n${interp(c.url, session.vars)}`);
          cur = next(cur.id, 0);
          break;

        case "image":
          out.push(`${interp(c.caption || "Image:", session.vars)}\n${interp(c.url, session.vars)}`);
          cur = next(cur.id, 0);
          break;

        case "media": {
          // image / video / document / audio — shared as a media URL (WhatsApp previews it)
          const icon = { image: "🖼️", video: "🎬", document: "📄", audio: "🔊" }[c.mediaType] || "📎";
          out.push([`${icon} ${interp(c.caption || "", session.vars)}`.trim(), interp(c.url, session.vars)].filter(Boolean).join("\n"));
          cur = next(cur.id, 0);
          break;
        }

        case "coupon":
          out.push(`${interp(c.message || "Use this coupon:", session.vars)}\nCode: ${interp(c.code, session.vars)}`);
          cur = next(cur.id, 0);
          break;

        case "payment_link":
          out.push(`${interp(c.message || "Payment link:", session.vars)}\n${interp(c.url, session.vars)}`);
          cur = next(cur.id, 0);
          break;

        case "location":
          out.push(
            [
              `📍 ${interp(c.title || "Our address", session.vars)}`,
              interp(c.address, session.vars),
              c.mapsUrl ? `🗺️ Directions: ${interp(c.mapsUrl, session.vars)}` : "",
            ].filter(Boolean).join("\n")
          );
          cur = next(cur.id, 0);
          break;

        case "contact_card":
          out.push(
            [
              `📇 ${interp(c.title || "Contact us", session.vars)}`,
              c.phone ? `📞 ${interp(c.phone, session.vars)}` : "",
              c.email ? `📧 ${interp(c.email, session.vars)}` : "",
              c.website ? `🌐 ${interp(c.website, session.vars)}` : "",
            ].filter(Boolean).join("\n")
          );
          cur = next(cur.id, 0);
          break;

        case "product_card":
          out.push(productText(c, session.vars));
          cur = next(cur.id, 0);
          break;

        case "catalog":
          out.push(catalogText(c, session.vars));
          cur = next(cur.id, 0);
          break;

        case "product_search":
          out.push(interp(c.question || "What product are you looking for?", session.vars));
          session.state = cur.id;
          return;

        case "csat":
          out.push(interp(c.question || "Rate your experience from 1 to 5.", session.vars));
          session.state = cur.id;
          return;

        case "business_hours": {
          const open = isOpenNow(c);
          out.push(interp(open ? c.openMessage : c.closedMessage, session.vars));
          cur = next(cur.id, open ? 0 : 1);
          break;
        }

        case "human_handoff":
          session.vars.handoff = "true";
          out.push(interp(c.message || "I am connecting you to a human teammate.", session.vars));
          cur = next(cur.id, 0);
          break;

        case "tag_customer": {
          const tags = new Set(String(session.vars.tags || "").split(",").filter(Boolean));
          if (c.tag) tags.add(c.tag);
          session.vars.tags = Array.from(tags).join(",");
          // an explicitly empty message means "tag silently"
          out.push(interp(c.message ?? `Tagged as ${c.tag}.`, session.vars));
          cur = next(cur.id, 0);
          break;
        }

        case "set_variable":
          session.vars[c.field || "value"] = interp(c.value || "", session.vars);
          out.push(interp(c.message ?? "Saved.", session.vars));
          cur = next(cur.id, 0);
          break;

        case "condition": {
          const actual = String(session.vars[c.field || "value"] ?? "").toLowerCase();
          const expected = String(c.value ?? "").toLowerCase();
          const match = c.operator === "contains" ? actual.includes(expected) : actual === expected;
          out.push(interp(match ? c.trueMessage : c.falseMessage, session.vars));
          cur = next(cur.id, match ? 0 : 1);
          break;
        }

        case "save_note":
          session.vars[c.field || "note"] = interp(c.note || "", session.vars);
          out.push(interp(c.message ?? "Note saved.", session.vars));
          cur = next(cur.id, 0);
          break;

        case "delay":
          // control marker — deliverReplies() pauses here; other surfaces strip it
          out.push(`DELAY:${Math.max(1, Math.min(30, parseInt(c.seconds, 10) || 3))}`);
          cur = next(cur.id, 0);
          break;

        case "http_request": {
          const r = await httpRequest(c, session.vars);
          const field = c.saveAs || "apiResult";
          if (r.ok) {
            session.vars[field] = r.value;
            if (c.successMessage) out.push(interp(c.successMessage, session.vars));
            cur = next(cur.id, 0);
          } else {
            session.vars[field + "_error"] = r.error;
            out.push(interp(c.errorMessage ?? "Sorry, I couldn't reach the service right now. Please try again later.", session.vars));
            cur = next(cur.id, 1);
          }
          break;
        }

        case "send_email": {
          // POST {to, subject, body} to any email endpoint (e.g. an Apps Script
          // MailApp webhook or an email API). Branches on success/error like http_request.
          const cfg = {
            method: "POST",
            url: c.url,
            headers: [{ key: "Content-Type", value: "application/json" }],
            body: JSON.stringify({ to: c.to || "", subject: c.subject || "", body: c.body || "" }),
          };
          const r = await httpRequest(cfg, session.vars);
          if (r.ok) {
            if (c.successMessage) out.push(interp(c.successMessage, session.vars));
            cur = next(cur.id, 0);
          } else {
            session.vars.email_error = r.error;
            if (c.errorMessage) out.push(interp(c.errorMessage, session.vars));
            cur = next(cur.id, 1);
          }
          break;
        }

        case "custom": {
          const waiting = await runCustomSteps(cur, session, out, 0, interp, optionPrompt);
          if (waiting) return;
          cur = next(cur.id, 0);
          break;
        }

        case "ai_reply":
          out.push(interp(c.greeting || "🤖 You're chatting with our AI assistant now. Ask me anything — type 0 to go back.", session.vars));
          session.state = cur.id;
          return;

        case "goodbye":
          out.push(interp(c.message, session.vars));
          session.state = null;
          session.vars = {};
          session.aiHist = {};
          return;

        default:
          cur = next(cur.id, 0);
      }
    }
    if (!cur) session.state = null;
  }

  const t = String(text || "").trim();

  if (!session.state) {
    const start = flow.nodes.find((n) => n.type === "welcome");
    if (!start) {
      out.push("This bot has no Welcome block configured yet.");
      return out;
    }
    await runFrom(start);
    return out;
  }

  // paused inside a custom block: handle the answer to that step, then resume
  if (session.state.startsWith("step|")) {
    const [, nodeId, idxStr] = session.state.split("|");
    const node = byId[nodeId];
    const idx = parseInt(idxStr, 10);
    const steps = node && Array.isArray(node.config?.steps) ? node.config.steps : [];
    const s = steps[idx];
    if (!node || !s) {
      session.state = null;
      return handleMessage(flow, text, session, trace);
    }
    if (s.kind === "ask") {
      if (!t) {
        out.push(interp(s.question || "Please share:", session.vars));
        return out;
      }
      const validator = ASK_VALIDATORS[s.validate];
      const result = validator ? validator(t) : { value: t };
      if (result.error) {
        out.push(result.error);
        return out;
      }
      session.state = null;
      session.vars[s.field || "value"] = result.value;
      if (s.ack) out.push(interp(s.ack, session.vars));
      const waiting = await runCustomSteps(node, session, out, idx + 1, interp, optionPrompt);
      if (!waiting) await continueOrEnd(node, 0);
      return out;
    }
    // ai step: chat with the owner's LLM until the customer types 0, then resume steps
    if (s.kind === "ai") {
      if (t === "0" || /^(exit|menu|back)$/i.test(t)) {
        delete (session.aiHist || {})[`${nodeId}:${idx}`];
        session.state = null;
        const waiting = await runCustomSteps(node, session, out, idx + 1, interp, optionPrompt);
        if (!waiting) await continueOrEnd(node, 0);
        return out;
      }
      if (!t) {
        out.push(interp(s.greeting || "🤖 Ask me anything — type 0 to continue.", session.vars));
        return out;
      }
      const hist = ((session.aiHist ??= {})[`${nodeId}:${idx}`] ??= []);
      const r = await aiReply(s, hist, t, session.vars);
      if (r.ok) {
        hist.push({ role: "user", content: t }, { role: "assistant", content: r.text });
        if (hist.length > 12) hist.splice(0, hist.length - 12);
        out.push(r.text);
      } else {
        out.push(`${interp(s.errorMessage || "Sorry, I'm having trouble thinking right now. Type 0 to continue.", session.vars)} (${r.error})`);
      }
      return out;
    }
    // choice step: same matching rules as menus, then branch to that port
    const options = s.options || [];
    const lower = t.toLowerCase();
    const num = t.match(/^(\d+)\s*[.)]?$/);
    let idx2 = num ? parseInt(num[1], 10) - 1 : -1;
    if (!(idx2 >= 0 && idx2 < options.length)) idx2 = options.findIndex((o) => String(o).toLowerCase() === lower);
    if (idx2 < 0 && lower.length >= 3) {
      const hits = options.map((o, i) => (String(o).toLowerCase().startsWith(lower) ? i : -1)).filter((i) => i >= 0);
      if (hits.length === 1) idx2 = hits[0];
    }
    if (idx2 >= 0 && idx2 < options.length) {
      session.state = null;
      session.vars.choice = options[idx2];
      if (s.field) session.vars[s.field] = options[idx2];
      await continueOrEnd(node, idx2);
    } else {
      out.push(`Sorry, I didn't catch that.\n\n${optionPrompt({ prompt: s.prompt, options }, session.vars)}`);
    }
    return out;
  }

  // waiting on an auto-collected variable: save the answer, re-run the block
  if (session.state.startsWith("ask|")) {
    const [, nodeId, varName] = session.state.split("|");
    const node = byId[nodeId];
    session.state = null;
    if (!node) return handleMessage(flow, text, session, trace);
    if (!t) {
      out.push(askFor(varName));
      session.state = `ask|${nodeId}|${varName}`;
      return out;
    }
    session.vars[varName] = t;
    await runFrom(node);
    return out;
  }

  const cur = byId[session.state];
  if (!cur) {
    session.state = null;
    return handleMessage(flow, text, session, trace);
  }

  const c = cur.config || {};

  if (menuTypes.has(cur.type)) {
    const options = c.options || [];
    const lower = t.toLowerCase();
    // accept the option number ("2", "2." or "2)"), the exact option text, or an unambiguous prefix
    const num = t.match(/^(\d+)\s*[.)]?$/);
    let idx = num ? parseInt(num[1], 10) - 1 : -1;
    if (!(idx >= 0 && idx < options.length)) {
      idx = options.findIndex((o) => String(o).toLowerCase() === lower);
    }
    if (idx < 0 && lower.length >= 3) {
      const prefixHits = options
        .map((o, i) => (String(o).toLowerCase().startsWith(lower) ? i : -1))
        .filter((i) => i >= 0);
      if (prefixHits.length === 1) idx = prefixHits[0];
    }
    if (idx >= 0 && idx < options.length) {
      session.vars[`${cur.type}_choice`] = options[idx];
      session.vars.choice = options[idx]; // generic alias for condition blocks
      if (cur.type === "language") session.vars.language = options[idx];
      await continueOrEnd(cur, idx);
    } else {
      out.push(`Sorry, I didn't catch that.\n\n${optionPrompt(c, session.vars)}`);
    }
    return out;
  }

  if (cur.type === "faq") {
    if (t === "0") {
      await continueOrEnd(cur, 0);
      return out;
    }
    const hit = (c.pairs || []).find((p) => t.toLowerCase().includes(String(p.k || "").toLowerCase()));
    out.push(hit ? interp(hit.a, session.vars) : "I don't have an answer for that yet. Try another keyword, or type 0 to continue.");
    return out;
  }

  if (collectConfig[cur.type]) {
    if (!t) {
      out.push(interp(c.question || collectConfig[cur.type].question || "Please share the details:", session.vars));
      return out;
    }
    if (cur.type === "collect_email" && !/^\S+@\S+\.\S+$/.test(t)) {
      out.push("That doesn't look like a valid email — please try again (e.g. name@example.com).");
      return out;
    }
    if (cur.type === "collect_phone" && t.replace(/\D/g, "").length < 7) {
      out.push("That doesn't look like a valid phone number — please send your full number with area code.");
      return out;
    }
    if (cur.type === "collect_number") {
      const numMatch = t.match(/\d+/);
      if (!numMatch) {
        out.push("Please reply with a number (e.g. 2).");
        return out;
      }
      session.vars[fieldName(cur)] = numMatch[0];
    } else {
      session.vars[fieldName(cur)] = t;
    }
    const meta = collectConfig[cur.type];
    const ack = c.ack || meta.ack || "Got it.";
    // acks may reference config fields too (e.g. tracking_link's {baseUrl})
    out.push(interp(ack, { ...c, ...session.vars }));
    await continueOrEnd(cur, 0);
    return out;
  }

  if (cur.type === "product_search") {
    const q = t.toLowerCase();
    const hit = (c.items || []).find((p) => {
      const haystack = `${p.name || ""} ${p.keywords || ""}`.toLowerCase();
      return haystack.includes(q) || q.includes(String(p.name || "").toLowerCase());
    });
    out.push(hit ? productText(hit, session.vars) : interp(c.notFound || "I could not find that product. Try another keyword.", session.vars));
    await continueOrEnd(cur, hit ? 0 : 1);
    return out;
  }

  if (cur.type === "csat") {
    const rating = parseInt(t, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      out.push("Please reply with a rating from 1 to 5.");
      return out;
    }
    session.vars[c.field || "rating"] = String(rating);
    out.push(interp(c.thanks || "Thanks for rating us {rating}/5.", session.vars));
    // fall back to the first wired port so a single outgoing wire covers all ratings
    const port = firstEdge(flow, cur.id, rating - 1) ? rating - 1 : 0;
    await continueOrEnd(cur, port);
    return out;
  }

  // AI chat mode: every message goes to the owner's LLM until the customer exits with 0
  if (cur.type === "ai_reply") {
    if (t === "0" || /^(exit|menu|back)$/i.test(t)) {
      delete (session.aiHist || {})[cur.id];
      await continueOrEnd(cur, 0);
      return out;
    }
    const hist = ((session.aiHist ??= {})[cur.id] ??= []);
    const r = await aiReply(c, hist, t, session.vars);
    if (r.ok) {
      hist.push({ role: "user", content: t }, { role: "assistant", content: r.text });
      if (hist.length > 12) hist.splice(0, hist.length - 12);
      out.push(r.text);
    } else {
      out.push(`${interp(c.errorMessage || "Sorry, I'm having trouble thinking right now. Type 0 to continue.", session.vars)} (${r.error})`);
    }
    return out;
  }

  // state pointed at a non-interactive block (stale flow edit) — restart cleanly
  session.state = null;
  return handleMessage(flow, text, session, trace);
}

module.exports = { handleMessage, interp };
