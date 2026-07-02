// ============================================================
// FlowBot Engine — deterministic flowchart interpreter.
// One pre-embedded handler per feature block. NO AI anywhere.
// Used by: the live provider webhooks, the frontend simulator API,
// and the standalone code export (codegen.js embeds this logic).
// ============================================================

const interp = (msg, vars) => msg.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);

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
  const next = (id, port) => {
    const e = flow.edges.find((x) => x.from === id && x.fromPort === port);
    return e ? byId[e.to] : null;
  };

  // --- feature templates: run a node, chain until the flow must wait ---
  function runFrom(node) {
    let cur = node;
    let guard = 0;
    while (cur && guard++ < 50) {
      const c = cur.config;
      switch (cur.type) {
        case "welcome": // Feature 1: greeting
          out.push(c.message);
          cur = next(cur.id, 0);
          break;
        case "menu": { // Feature 2: numbered menu (branches)
          const lines = c.options.map((o, i) => `${i + 1}. ${o}`).join("\n");
          out.push(`${c.prompt}\n\n${lines}\n\nReply with a number.`);
          session.state = cur.id;
          return;
        }
        case "faq": { // Feature 3: keyword auto-reply
          const kws = c.pairs.map((p) => `"${p.k}"`).join(", ");
          out.push(`Ask me anything — try keywords like ${kws}.\nType 0 when you're done.`);
          session.state = cur.id;
          return;
        }
        case "collect": // Feature 4: collect info into a variable
          out.push(c.question);
          session.state = cur.id;
          return;
        case "goodbye": // Feature 5: goodbye / handoff (ends session)
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

  // No active state → start from the Welcome (entry) block
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

  if (cur.type === "menu") {
    const idx = parseInt(t, 10) - 1;
    if (Number.isInteger(idx) && idx >= 0 && idx < cur.config.options.length) {
      const nx = next(cur.id, idx);
      if (nx) runFrom(nx);
      else {
        session.state = null;
        out.push("Done! Say hi to start again.");
      }
    } else {
      out.push(`Please reply with a number between 1 and ${cur.config.options.length}.`);
    }
    return out;
  }

  if (cur.type === "faq") {
    if (t === "0") {
      const nx = next(cur.id, 0);
      if (nx) runFrom(nx);
      else {
        session.state = null;
        out.push("Done! Say hi to start again.");
      }
      return out;
    }
    const hit = cur.config.pairs.find((p) => t.toLowerCase().includes(p.k.toLowerCase()));
    out.push(hit ? hit.a : "I don't have an answer for that yet. Try another keyword, or type 0 to continue.");
    return out;
  }

  if (cur.type === "collect") {
    session.vars[cur.config.field] = t;
    out.push("Got it.");
    const nx = next(cur.id, 0);
    if (nx) runFrom(nx);
    else session.state = null;
    return out;
  }

  session.state = null;
  return out;
}

module.exports = { handleMessage, interp };
