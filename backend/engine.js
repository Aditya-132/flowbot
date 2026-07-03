// ============================================================
// FlowBot Engine — deterministic flowchart interpreter.
// NO AI anywhere. Used by live webhooks, simulator, and codegen.
// ============================================================

// Unresolved {vars} stay visible as {var} — clearer than silently printing the key.
const interp = (msg, vars) => String(msg || "").replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

const menuTypes = new Set(["menu", "quick_reply", "language", "lead_qualify"]);
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
const SCAN_KEYS = ["message", "prompt", "question", "caption", "title", "openMessage", "closedMessage", "trueMessage", "falseMessage", "url", "code", "note", "value"];

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
  return null;
}

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
 * @param {object} flow     {nodes:[{id,type,config}], edges:[{from,fromPort,to}]}
 * @param {string} text     incoming message body
 * @param {object} session  mutable {state, vars}
 * @returns {string[]}      bot replies
 */
function handleMessage(flow, text, session) {
  // drop empty strings so optional messages (blank condition/hours text) never
  // reach the provider — WhatsApp APIs reject empty bodies
  const replies = processMessage(flow, text, session).map((r) => String(r ?? "").trim()).filter(Boolean);
  // never leave the customer on silence when a branch dead-ends
  if (!replies.length) replies.push("✅ That's all for now. Send any message to start over.");
  return replies;
}

function processMessage(flow, text, session) {
  const out = [];
  const byId = Object.fromEntries(flow.nodes.map((n) => [n.id, n]));
  const next = (id, port) => getNext(flow, byId, id, port);

  function continueOrEnd(node, port = 0) {
    const nx = next(node.id, port);
    if (nx) runFrom(nx);
    else session.state = null;
  }

  function runFrom(node) {
    let cur = node;
    let guard = 0;
    while (cur && guard++ < 80) {
      const c = cur.config || {};

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

        case "goodbye":
          out.push(interp(c.message, session.vars));
          session.state = null;
          session.vars = {};
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
    runFrom(start);
    return out;
  }

  // waiting on an auto-collected variable: save the answer, re-run the block
  if (session.state.startsWith("ask|")) {
    const [, nodeId, varName] = session.state.split("|");
    const node = byId[nodeId];
    session.state = null;
    if (!node) return handleMessage(flow, text, session);
    if (!t) {
      out.push(askFor(varName));
      session.state = `ask|${nodeId}|${varName}`;
      return out;
    }
    session.vars[varName] = t;
    runFrom(node);
    return out;
  }

  const cur = byId[session.state];
  if (!cur) {
    session.state = null;
    return handleMessage(flow, text, session);
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
      continueOrEnd(cur, idx);
    } else {
      out.push(`Sorry, I didn't catch that.\n\n${optionPrompt(c, session.vars)}`);
    }
    return out;
  }

  if (cur.type === "faq") {
    if (t === "0") {
      continueOrEnd(cur, 0);
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
    continueOrEnd(cur, 0);
    return out;
  }

  if (cur.type === "product_search") {
    const q = t.toLowerCase();
    const hit = (c.items || []).find((p) => {
      const haystack = `${p.name || ""} ${p.keywords || ""}`.toLowerCase();
      return haystack.includes(q) || q.includes(String(p.name || "").toLowerCase());
    });
    out.push(hit ? productText(hit, session.vars) : interp(c.notFound || "I could not find that product. Try another keyword.", session.vars));
    continueOrEnd(cur, hit ? 0 : 1);
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
    continueOrEnd(cur, port);
    return out;
  }

  // state pointed at a non-interactive block (stale flow edit) — restart cleanly
  session.state = null;
  return handleMessage(flow, text, session);
}

module.exports = { handleMessage, interp };
