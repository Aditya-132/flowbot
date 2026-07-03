// ============================================================
// FlowBot Engine — deterministic flowchart interpreter.
// NO AI anywhere. Used by live webhooks, simulator, and codegen.
// ============================================================

const interp = (msg, vars) => String(msg || "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);

const menuTypes = new Set(["menu", "quick_reply", "language", "lead_qualify"]);
const collectConfig = {
  collect: { field: "field", question: "question", ack: "Got it." },
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
          out.push(interp(c.message || `Tagged as ${c.tag}.`, session.vars));
          cur = next(cur.id, 0);
          break;
        }

        case "set_variable":
          session.vars[c.field || "value"] = interp(c.value || "", session.vars);
          out.push(interp(c.message || "Saved.", session.vars));
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
          out.push(interp(c.message || "Note saved.", session.vars));
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

  const cur = byId[session.state];
  if (!cur) {
    session.state = null;
    return handleMessage(flow, text, session);
  }

  const c = cur.config || {};

  if (menuTypes.has(cur.type)) {
    const idx = parseInt(t, 10) - 1;
    const options = c.options || [];
    if (Number.isInteger(idx) && idx >= 0 && idx < options.length) {
      session.vars[`${cur.type}_choice`] = options[idx];
      continueOrEnd(cur, idx);
    } else {
      out.push(`Please reply with a number between 1 and ${options.length}.`);
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
    session.vars[fieldName(cur)] = t;
    const meta = collectConfig[cur.type];
    const ack = c.ack || meta.ack || "Got it.";
    out.push(interp(ack, session.vars));
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
    continueOrEnd(cur, rating - 1);
    return out;
  }

  session.state = null;
  return out;
}

module.exports = { handleMessage, interp };
