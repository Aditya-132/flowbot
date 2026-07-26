// ============================================================
// Chaos Test — hammer a draft flow with simulated "messy customers"
// (typos, emoji, blank messages, out-of-range numbers, wrong formats)
// and report where real customers would get stuck.
// Pure dry-run: runs the deterministic engine with dryRun=true, so no
// HTTP / email / AI call ever fires. Seeded PRNG ⇒ the same canvas
// always produces the same report (business-hours blocks excepted —
// they honestly follow the wall clock).
// ============================================================

const { handleMessage, menuTypes } = require("./engine");

const CTRL = "\u0000"; // Delay/Media control markers — not customer-visible text

const CUSTOMERS = 100;
const MAX_TURNS = 12;
const GIVE_UP_STREAK = 4; // real customers stop retrying — also caps wasted turns
const LOOP_BURST = 40;    // one inbound → 40+ replies ⇒ non-interactive blocks likely cycle

// deterministic PRNG (mulberry32) — reproducible chaos, on purpose
const mulberry32 = (seed) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// every retry message the engine can produce when it rejects an input
const REJECT_RE = /Sorry, I didn't catch that|doesn't look like a valid|Please reply with a number|Please reply with a rating|^Before we continue — please share/m;

const OPENERS = ["hi", "Hello!", "hey there", "Hi 👋", "namaste", "yo"];

const GENERIC_CHAOS = [
  "", "   ", "😂😂🙏", "asdf hjkl", "??", "hmm ok", "yes", "no", "help",
  "menu", "stop", "9999", "hello??", "idk", "one", "1.5", "...", "N/A",
  "why", "👍", "x".repeat(400),
];

const VALID_BY_KIND = { number: "3", email: "chaos.tester@example.com", phone: "+1 555 010 7788" };

// session.state → the node the bot is waiting on ("ask|id|var", "step|id|i" or a bare id)
function nodeForState(byId, state) {
  if (!state) return null;
  if (state.startsWith("ask|") || state.startsWith("step|")) return byId[state.split("|")[1]] || null;
  return byId[state] || null;
}

function stepForState(node, state) {
  if (!node || !state || !state.startsWith("step|")) return null;
  return (node.config?.steps || [])[parseInt(state.split("|")[2], 10)] || null;
}

/* A valid answer for whatever the bot is currently waiting on — half the turns
   are cooperative so the chaos customers actually reach the DEEP blocks instead
   of all piling up at the first menu. */
function cooperativeInput(node, state, rng) {
  if (!node) return pick(rng, OPENERS);
  const c = node.config || {};
  if (state.startsWith("ask|")) {
    const varName = state.split("|")[2] || "";
    if (/mail/i.test(varName)) return VALID_BY_KIND.email;
    if (/phone|mobile|whatsapp/i.test(varName)) return VALID_BY_KIND.phone;
    return "tomorrow at 4pm"; // auto-collect accepts any non-empty answer
  }
  const step = stepForState(node, state);
  if (step) {
    if (step.kind === "choice") return String(1 + Math.floor(rng() * Math.max(1, (step.options || []).length)));
    if (step.kind === "ai") return "0"; // exit AI chat, resume the flow
    return VALID_BY_KIND[step.validate] || "sounds good";
  }
  if (menuTypes.has(node.type)) return String(1 + Math.floor(rng() * Math.max(1, (c.options || []).length)));
  if (node.type === "collect_email") return VALID_BY_KIND.email;
  if (node.type === "collect_phone") return VALID_BY_KIND.phone;
  if (node.type === "collect_number") return VALID_BY_KIND.number;
  if (node.type === "csat") return String(1 + Math.floor(rng() * 5));
  if (node.type === "faq" || node.type === "ai_reply") return "0"; // move on
  if (node.type === "product_search") return (c.items || [])[0]?.name || "something nice";
  return "yes please"; // free-text collects & friends — anything non-empty works
}

/* A messy answer — context-aware nastiness when we know what the bot expects
   (realistic typos, out-of-range choices, "my email is x@y.com"…), otherwise
   the generic pool (emoji, blanks, gibberish, STOP/help/menu). */
function chaosInput(node, state, rng) {
  const c = node?.config || {};
  const step = stepForState(node, state);
  const contextual = [];

  const options = step
    ? (step.kind === "choice" ? step.options || [] : null)
    : node && menuTypes.has(node.type) && !String(state || "").includes("|") ? c.options || [] : null;
  if (options) {
    contextual.push(String(options.length + 1), "0", "yes", "the first one", "2 please");
    if (options.length) {
      const o = String(pick(rng, options));
      contextual.push(o + "z");                          // fat-finger typo — no match possible
      if (o.length > 4) contextual.push(o.slice(0, -1)); // truncation — the unique-prefix rule saves this one
    }
  }

  let validate = null;
  if (step?.kind === "ask") validate = step.validate;
  else if (!step && node && !String(state || "").startsWith("ask|"))
    validate = { collect_email: "email", collect_phone: "phone", collect_number: "number" }[node.type] || null;
  if (validate === "email") contextual.push("my email is chaos.tester@example.com", "chaos at example dot com", "no");
  if (validate === "phone") contextual.push("call me", "12345", "no thanks");
  if (validate === "number") contextual.push("one", "a few", "idk");
  if (node?.type === "csat") contextual.push("10", "amazing!!", "0");

  if (contextual.length && rng() < 0.6) return pick(rng, contextual);
  return pick(rng, GENERIC_CHAOS);
}

const displayText = (t) => {
  const s = String(t);
  if (!s.trim()) return s.length ? "(only spaces)" : "(empty message)";
  return s.length > 60 ? s.slice(0, 57) + `… (${s.length} chars)` : s;
};

async function runChaos(flow) {
  const byId = Object.fromEntries(flow.nodes.map((n) => [n.id, n]));
  const stats = new Map(); // nodeId → {attempts, rejections, stuckCustomers, worstStreak, sample}
  const faq = new Map();   // nodeId → {asked, missed}
  let clean = 0, turns = 0, rejections = 0, deadEnds = 0, loops = 0;

  const statFor = (id) => {
    if (!stats.has(id)) stats.set(id, { nodeId: id, attempts: 0, rejections: 0, stuckCustomers: 0, worstStreak: 0, sample: null });
    return stats.get(id);
  };

  for (let ci = 0; ci < CUSTOMERS; ci++) {
    const rng = mulberry32(0x5eed + ci * 7919); // per-customer seed → reproducible runs
    const session = { state: null, vars: {} };
    let streak = 0, streakState = null, everStuck = false;
    const countedHere = new Set(); // nodes this customer already counted as stuck at

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      if (turn > 0 && !session.state) break; // conversation over — a clean exit
      const stateBefore = session.state;
      const nodeBefore = nodeForState(byId, stateBefore);
      const text = !stateBefore ? pick(rng, OPENERS)
        : rng() < 0.5 ? cooperativeInput(nodeBefore, stateBefore, rng)
        : chaosInput(nodeBefore, stateBefore, rng);

      const replies = await handleMessage(flow, text, session, null, true); // dryRun
      const reply = replies.filter((r) => !r.startsWith(CTRL)).join("\n");
      turns++;

      if (replies.length >= LOOP_BURST) loops++;
      // the engine papers over an unwired branch with this filler — count the real hits
      if (reply.includes("✅ That's all for now")) deadEnds++;

      if (nodeBefore?.type === "faq") {
        // FAQ keeps its state by design — a miss isn't "stuck", but track the hit rate
        const f = faq.get(nodeBefore.id) || { nodeId: nodeBefore.id, asked: 0, missed: 0 };
        if (String(text).trim() !== "0") {
          f.asked++;
          if (reply.includes("I don't have an answer for that yet")) f.missed++;
        }
        faq.set(nodeBefore.id, f);
        continue;
      }

      // AI chat mode also holds its state on purpose (and dry-run always answers)
      const step = stepForState(nodeBefore, stateBefore);
      const aiState = nodeBefore && (nodeBefore.type === "ai_reply" || step?.kind === "ai");

      if (stateBefore && nodeBefore && !aiState) {
        const st = statFor(nodeBefore.id);
        st.attempts++;
        // rejected = still waiting on the same state AND the reply is a known retry
        // message (or the input was blank, which always re-asks). The reply check
        // avoids a false positive when a flow legitimately loops back to the same menu.
        const rejected = session.state === stateBefore && (REJECT_RE.test(reply) || !String(text).trim());
        if (rejected) {
          rejections++;
          st.rejections++;
          streak = streakState === stateBefore ? streak + 1 : 1;
          streakState = stateBefore;
          if (streak >= 2) { // one polite retry is fine UX — twice in a row means trouble
            everStuck = true;
            st.worstStreak = Math.max(st.worstStreak, streak);
            if (!countedHere.has(nodeBefore.id)) { countedHere.add(nodeBefore.id); st.stuckCustomers++; }
            if (!st.sample) st.sample = { sent: displayText(text), reply: reply.slice(0, 280) };
          }
          if (streak >= GIVE_UP_STREAK) break; // this customer gives up
          continue;
        }
      }
      streak = 0; streakState = null;
    }
    if (!everStuck) clean++;
  }

  return {
    customers: CUSTOMERS,
    clean,
    score: Math.round((100 * clean) / CUSTOMERS),
    turns,
    rejections,
    deadEnds,
    loops,
    weakSpots: [...stats.values()]
      .filter((s) => s.stuckCustomers > 0)
      .sort((a, b) => b.stuckCustomers - a.stuckCustomers)
      .slice(0, 10),
    faqSpots: [...faq.values()].filter((f) => f.asked >= 5 && f.missed / f.asked > 0.4),
  };
}

module.exports = { runChaos };
