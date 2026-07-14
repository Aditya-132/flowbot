// ============================================================
// Public bot surfaces — no login required:
//   • /chat/:key    standalone chat page (used directly and by the embed)
//   • /widget.js    embed script site owners paste into their website
//   • /share/:key   public share page: flowchart preview + try-it chat
// One public_key per flow powers all three; widget_enabled / share_enabled
// flags control which surfaces are on.
// ============================================================

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- node metadata for the share-page flowchart preview ---------- */
// Mirrors the builder palette (labels/colors) just for display.
const NODE_META = {
  welcome: ["Welcome Message", "#25D366"],
  menu: ["Menu Options", "#F5B841"],
  faq: ["FAQ Auto-Reply", "#4EA8DE"],
  collect: ["Collect Info", "#B983FF"],
  goodbye: ["Goodbye / Handoff", "#ef4444"],
  text: ["Text Message", "#60A5FA"],
  quick_reply: ["Quick Replies", "#FACC15"],
  link: ["Send Link", "#38BDF8"],
  image: ["Image / Media", "#A78BFA"],
  coupon: ["Coupon Code", "#FB7185"],
  product_card: ["Product Card", "#34D399"],
  catalog: ["Mini Catalog", "#22C55E"],
  product_search: ["Product Search", "#06B6D4"],
  order_status: ["Order Status", "#F97316"],
  tracking_link: ["Tracking Link", "#84CC16"],
  appointment: ["Appointment Booking", "#e879f9"],
  booking_confirm: ["Booking Confirm", "#c084fc"],
  lead_qualify: ["Lead Qualification", "#fb923c"],
  collect_email: ["Collect Email", "#93c5fd"],
  collect_phone: ["Collect Phone", "#86efac"],
  collect_address: ["Collect Address", "#fcd34d"],
  csat: ["CSAT Rating", "#f472b6"],
  feedback: ["Feedback", "#a5b4fc"],
  language: ["Language Router", "#2dd4bf"],
  business_hours: ["Business Hours", "#fbbf24"],
  human_handoff: ["Human Handoff", "#f87171"],
  tag_customer: ["Tag Customer", "#94a3b8"],
  set_variable: ["Set Variable", "#cbd5e1"],
  condition: ["Condition", "#818cf8"],
  save_note: ["Save Note", "#d8b4fe"],
  http_request: ["HTTP Request / API", "#0ea5e9"],
  ai_reply: ["AI Reply", "#a855f7"],
  payment_link: ["Payment Link", "#4ade80"],
  return_policy: ["Return Policy", "#fca5a5"],
  shipping_info: ["Shipping Info", "#7dd3fc"],
  abandoned_cart: ["Cart Recovery", "#fdba74"],
  review_request: ["Review Request", "#fde047"],
  collect_number: ["Collect Number", "#99f6e4"],
  location: ["Location / Map", "#6ee7b7"],
  contact_card: ["Contact Card", "#c4b5fd"],
};

const nodeMeta = (n) => {
  if (n.type === "custom") return [n.config?.name || "Custom block", n.config?.color || "#9BE8C0"];
  return NODE_META[n.type] || [n.type.replace(/_/g, " "), "#94a3b8"];
};

/* ---------- SVG flowchart preview (server-rendered, read-only) ---------- */
function flowSvg(flow) {
  const nodes = flow.nodes || [];
  if (!nodes.length) return "";
  const W = 180, H = 58;
  const xs = nodes.map((n) => n.x || 0), ys = nodes.map((n) => n.y || 0);
  const minX = Math.min(...xs) - 30, minY = Math.min(...ys) - 30;
  const maxX = Math.max(...xs) + W + 30, maxY = Math.max(...ys) + H + 30;
  const pos = Object.fromEntries(nodes.map((n) => [n.id, { x: n.x || 0, y: n.y || 0 }]));

  const wires = (flow.edges || [])
    .filter((e) => pos[e.from] && pos[e.to])
    .map((e) => {
      const a = pos[e.from], b = pos[e.to];
      const x1 = a.x + W, y1 = a.y + H / 2 + Math.min(Number(e.fromPort) || 0, 3) * 8 - 8;
      const x2 = b.x, y2 = b.y + H / 2;
      const dx = Math.max(40, (x2 - x1) / 2);
      return `<path d="M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" fill="none" stroke="#25D366" stroke-width="2.5" opacity="0.6"/>`;
    })
    .join("");

  const cards = nodes
    .map((n) => {
      const [label, color] = nodeMeta(n);
      const short = label.length > 22 ? label.slice(0, 21) + "…" : label;
      return `<g>
  <rect x="${n.x}" y="${n.y}" width="${W}" height="${H}" rx="12" fill="#ffffff" stroke="#dbe7df" stroke-width="1.5"/>
  <rect x="${n.x}" y="${n.y}" width="7" height="${H}" rx="3.5" fill="${esc(color)}"/>
  <text x="${n.x + 18}" y="${n.y + 35}" font-family="system-ui,sans-serif" font-size="14.5" font-weight="700" fill="#12301f">${esc(short)}</text>
</g>`;
    })
    .join("");

  return `<svg viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Flowchart preview of this bot">
<rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="#f4f8f5"/>
${wires}${cards}</svg>`;
}

/* ---------- standalone chat page (/chat/:key) ---------- */
function renderChatPage(flow, key, canonical, { embedded = false } = {}) {
  const name = esc(flow.name || "Chat");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} — chat</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#e9efe9;display:flex;flex-direction:column;height:100vh;height:100dvh}
header{background:#0b6e4f;color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;flex:none}
header .dot{width:34px;height:34px;border-radius:50%;background:#25D366;display:grid;place-items:center;font-size:17px}
header .t{font-weight:800;font-size:15px}
header .s{font-size:11px;color:#bfe8d2}
header button{margin-left:auto;background:rgba(255,255,255,.15);border:0;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px}
#msgs{flex:1;overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:8px}
.b{max-width:82%;padding:9px 13px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;box-shadow:0 1px 2px rgba(11,40,24,.08)}
.bot{background:#fff;border-top-left-radius:4px;align-self:flex-start}
.me{background:#d9fdd3;border-top-right-radius:4px;align-self:flex-end}
.typing{opacity:.65;font-style:italic}
form{display:flex;gap:8px;padding:10px 12px;background:#f4f8f5;border-top:1px solid #dbe7df;flex:none}
input{flex:1;border:1px solid #cfe0d5;border-radius:22px;padding:11px 16px;font-size:16px;outline:none;background:#fff}
button.send{background:#25D366;border:0;border-radius:50%;width:44px;height:44px;font-size:17px;cursor:pointer;flex:none}
.powered{flex:none;text-align:center;font-size:11px;padding:5px 0 7px;background:#f4f8f5;color:#5b7466}
.powered a{color:#0e7a4b;font-weight:700;text-decoration:none}
</style>
</head>
<body>
<header>
  <div class="dot">🤖</div>
  <div><div class="t">${name}</div><div class="s">usually replies instantly</div></div>
  <button id="reset" title="Restart the conversation">↻ Restart</button>
</header>
<div id="msgs"></div>
<form id="f"><input id="in" placeholder="Type a message…" autocomplete="off" maxlength="1000"><button class="send" type="submit" aria-label="Send">➤</button></form>
<div class="powered">⚡ Powered by <a href="${canonical}/?utm_source=widget&utm_medium=chat" target="_blank" rel="noopener">FlowBot</a> — build yours free</div>
<script>
(function(){
  var KEY=${JSON.stringify(key)};
  var msgs=document.getElementById("msgs"),form=document.getElementById("f"),inp=document.getElementById("in");
  var sidKey="fb_sid_"+KEY,sid;
  try{sid=localStorage.getItem(sidKey);}catch(e){}
  if(!sid){sid=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);try{localStorage.setItem(sidKey,sid);}catch(e){}}
  function add(text,side){var d=document.createElement("div");d.className="b "+side;d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;return d;}
  var busy=false;
  function send(text,reset){
    if(busy)return;busy=true;
    var t=add("…","bot typing");
    fetch("/api/public/"+KEY+"/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:sid,message:text,reset:!!reset})})
      .then(function(r){return r.json();})
      .then(function(d){t.remove();(d.replies||[d.error||"Sorry, something went wrong."]).forEach(function(m){add(m,"bot");});})
      .catch(function(){t.remove();add("Network error — please try again.","bot");})
      .finally(function(){busy=false;});
  }
  form.addEventListener("submit",function(e){e.preventDefault();var v=inp.value.trim();if(!v||busy)return;add(v,"me");inp.value="";send(v);});
  document.getElementById("reset").addEventListener("click",function(){msgs.innerHTML="";send("hi",true);});
  send("hi",true);
})();
</script>
</body>
</html>`;
}

/* ---------- embed script (/widget.js) ---------- */
function renderWidgetJs(canonical) {
  return `/* FlowBot chat widget — https://flochatbot.com */
(function () {
  var s = document.currentScript || (function (ss) { return ss[ss.length - 1]; })(document.getElementsByTagName("script"));
  var key = s && s.getAttribute("data-flowbot");
  if (!key) { console.warn("FlowBot widget: missing data-flowbot key"); return; }
  var origin; // chat iframe lives wherever this script was loaded from
  try { origin = new URL(s.src).origin; } catch (e) { origin = ${JSON.stringify("__ORIGIN__")}; }
  var open = false, frame = null;

  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 3C7 3 3 6.6 3 11c0 2.1.9 4 2.4 5.4L4.5 20c-.1.4.3.8.7.6l3.6-1.5c1 .3 2.1.4 3.2.4 5 0 9-3.6 9-8S17 3 12 3z" fill="#fff"/></svg>';
  btn.style.cssText = "position:fixed;bottom:20px;right:20px;width:58px;height:58px;border-radius:50%;background:#25D366;border:none;cursor:pointer;z-index:2147483000;box-shadow:0 6px 24px rgba(11,40,24,.35);display:flex;align-items:center;justify-content:center;transition:transform .15s";
  btn.onmouseenter = function () { btn.style.transform = "scale(1.07)"; };
  btn.onmouseleave = function () { btn.style.transform = "scale(1)"; };

  function toggle() {
    open = !open;
    if (open && !frame) {
      frame = document.createElement("iframe");
      frame.src = origin + "/chat/" + encodeURIComponent(key);
      frame.title = "Chat";
      frame.style.cssText = "position:fixed;bottom:90px;right:20px;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 110px));border:none;border-radius:16px;z-index:2147483000;box-shadow:0 12px 48px rgba(11,40,24,.35);background:#fff";
      document.body.appendChild(frame);
    }
    if (frame) frame.style.display = open ? "block" : "none";
    btn.innerHTML = open
      ? '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>'
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 3C7 3 3 6.6 3 11c0 2.1.9 4 2.4 5.4L4.5 20c-.1.4.3.8.7.6l3.6-1.5c1 .3 2.1.4 3.2.4 5 0 9-3.6 9-8S17 3 12 3z" fill="#fff"/></svg>';
  }
  btn.addEventListener("click", toggle);
  if (document.body) document.body.appendChild(btn);
  else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(btn); });
})();
`.replace('"__ORIGIN__"', JSON.stringify(canonical));
}

/* ---------- public share page (/share/:key) ---------- */
function renderSharePage(flow, key, canonical) {
  const name = esc(flow.name || "A WhatsApp bot");
  const blocks = (flow.nodes || []).length;
  const svg = flowSvg(flow);
  const title = `${name} — WhatsApp bot built with FlowBot`;
  const desc = `Try "${flow.name}" live in your browser — a ${blocks}-block WhatsApp bot built free with FlowBot's drag-and-drop builder. Clone it and make it yours.`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:site_name" content="FlowBot">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}/share/${esc(key)}">
<meta property="og:image" content="${canonical}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#17301f;background:#f4f8f5;line-height:1.6}
a{color:#0e7a4b}
header.site{background:#fff;border-bottom:1px solid #e2ede6;padding:10px 20px;display:flex;align-items:center;gap:14px}
.logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:19px;color:#0b2818;text-decoration:none}
.cta{background:#25D366;color:#06130b;font-weight:800;padding:10px 18px;border-radius:999px;text-decoration:none;display:inline-block}
.wrap{max-width:1060px;margin:0 auto;padding:0 20px}
h1{font-size:clamp(24px,4vw,34px);margin:26px 0 4px}
.sub{color:#5b7466;margin:0 0 22px}
.cols{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:start}
@media(max-width:860px){.cols{grid-template-columns:1fr}}
.panel{background:#fff;border:1px solid #e2ede6;border-radius:16px;overflow:hidden}
.panel .cap{padding:10px 16px;font-weight:700;font-size:13.5px;border-bottom:1px solid #e2ede6;color:#33523f}
.flowwrap{overflow:auto;max-height:520px}
.flowwrap svg{display:block;min-width:600px;width:100%}
iframe.chat{width:100%;height:520px;border:none;display:block}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0 40px}
.ghost{border:2px solid #25D366;color:#0e7a4b;font-weight:800;padding:9px 18px;border-radius:999px;text-decoration:none}
footer{color:#5b7466;font-size:13px;padding:18px 0 30px}
</style>
</head>
<body>
<header class="site">
  <a class="logo" href="${canonical}/"><svg width="30" height="30" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#25D366"/><stop offset="1" stop-color="#128C7E"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><path d="M36 8 L18 36 h10 L26 56 L46 26 h-11 z" fill="#06130b"/></svg> FlowBot</a>
  <a class="cta" style="margin-left:auto" href="${canonical}/app">Build your own — free</a>
</header>
<main class="wrap">
  <h1>${name}</h1>
  <p class="sub">A ${blocks}-block WhatsApp bot built with <a href="${canonical}/">FlowBot</a>, the free drag-and-drop bot builder. Chat with it live, peek at the flowchart, or clone it and make it yours.</p>
  <div class="cols">
    <div class="panel"><div class="cap">🗺️ The flowchart behind this bot</div><div class="flowwrap">${svg}</div></div>
    <div class="panel"><div class="cap">💬 Try it live</div><iframe class="chat" src="/chat/${esc(key)}" title="Chat with ${name}"></iframe></div>
  </div>
  <div class="actions">
    <a class="cta" href="${canonical}/app?clone=${esc(key)}">⚡ Clone this bot in the builder</a>
    <a class="ghost" href="${canonical}/">What is FlowBot?</a>
  </div>
  <footer>Built with FlowBot — design WhatsApp bots as flowcharts, test them live, launch on Meta / Twilio / Green API / Whapi, or export the code. Free.</footer>
</main>
</body>
</html>`;
}

module.exports = { renderChatPage, renderWidgetJs, renderSharePage, flowSvg };
