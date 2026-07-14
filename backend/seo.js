// ============================================================
// SEO pages — server-rendered marketing/content pages.
// Static HTML (no JS framework) so crawlers, AI assistants and
// social scrapers get full content instantly. The app itself
// lives at /app; these pages link into it.
// Also generates sitemap.xml + llms.txt from the same registry.
// ============================================================

const CANONICAL = "https://flochatbot.com";
const LASTMOD = "2026-07-14"; // bump when page copy changes

/* ------------------------------ helpers ------------------------------ */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// FAQ block: visible <details> list + matching FAQPage JSON-LD
const faqHtml = (faqs) =>
  faqs
    .map(
      (f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`
    )
    .join("\n");

const faqJsonLd = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") },
  })),
});

const breadcrumbJsonLd = (page) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "FlowBot", item: `${CANONICAL}/` },
    { "@type": "ListItem", position: 2, name: page.crumb || page.h1, item: `${CANONICAL}${page.path}` },
  ],
});

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FlowBot",
  url: `${CANONICAL}/`,
  logo: `${CANONICAL}/icon-512.png`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FlowBot",
  url: `${CANONICAL}/`,
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FlowBot",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Chatbot Builder",
  operatingSystem: "Web",
  url: `${CANONICAL}/`,
  description:
    "Free visual drag-and-drop WhatsApp bot builder. Design chatbot flows on a canvas, test them in a live simulator, launch on Meta WhatsApp Cloud API, Twilio, Green API or Whapi.cloud, or export the complete bot code as a ZIP.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  featureList: [
    "Drag & drop flowchart bot designer",
    "40+ ready-made WhatsApp feature blocks",
    "Block Lab — build your own custom blocks from steps",
    "AI Builder — describe your bot in chat, get the flowchart",
    "Ready templates: restaurant, bank, hotel, chess academy, online store",
    "Live chat simulator",
    "Meta Cloud API, Twilio, Green API and Whapi.cloud integrations",
    "HTTP Request block to call any external API",
    "Optional AI Reply block with your own Anthropic / OpenAI / Gemini key",
    "Embeddable website chat widget (same flow, no WhatsApp needed)",
    "Public share pages — let anyone try your bot live and clone it",
    "Per-bot analytics: conversations, messages, channels",
    "Full bot code export as ZIP (Node.js + Express)",
  ],
};

/* ------------------------------ layout ------------------------------ */

const CSS = `
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#17301f;background:#f4f8f5;line-height:1.65}
a{color:#0e7a4b}h1,h2,h3{line-height:1.25;color:#0b2818}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}
header.site{background:#fff;border-bottom:1px solid #e2ede6;position:sticky;top:0;z-index:5}
header.site .wrap{display:flex;align-items:center;gap:18px;padding:10px 20px;flex-wrap:wrap}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;color:#0b2818;text-decoration:none}
.logo svg{border-radius:9px}
nav.top{display:flex;gap:16px;flex-wrap:wrap;font-size:14.5px;margin-left:auto;align-items:center}
nav.top a{text-decoration:none;color:#355441;font-weight:600}
nav.top a:hover{color:#0e7a4b}
.cta,a.cta{background:#25D366;color:#06130b;font-weight:800;padding:10px 18px;border-radius:999px;text-decoration:none;display:inline-block}
.cta:hover{background:#1fc25b}
.cta.big{font-size:18px;padding:14px 28px}
.hero{padding:56px 0 30px;display:flex;gap:36px;align-items:center;flex-wrap:wrap}
.hero>div{flex:1 1 420px}
.hero h1{font-size:clamp(30px,4.5vw,46px);margin:0 0 14px}
.hero p.lead{font-size:19px;color:#33523f;margin:0 0 24px}
.hero .sub{font-size:14px;color:#5b7466;margin-top:12px}
.hero svg{max-width:100%;height:auto}
section{padding:26px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-top:18px}
.card{background:#fff;border:1px solid #e2ede6;border-radius:14px;padding:18px}
.card h3{margin:0 0 8px;font-size:17px}
.card p{margin:0;font-size:15px;color:#44604f}
table{border-collapse:collapse;width:100%;margin-top:14px;background:#fff;border-radius:12px;overflow:hidden;font-size:15px}
th,td{border:1px solid #e2ede6;padding:10px 14px;text-align:left;vertical-align:top}
th{background:#eaf6ee}
.tablewrap{overflow-x:auto}
.faq{background:#fff;border:1px solid #e2ede6;border-radius:12px;padding:14px 18px;margin:10px 0}
.faq summary{font-weight:700;cursor:pointer}
.faq p{margin:10px 0 4px;color:#44604f}
article.doc p, article.doc li{color:#2c4636;font-size:16.5px}
article.doc h2{margin-top:38px;font-size:26px}
ol.steps li{margin-bottom:14px}
footer.site{background:#0b2818;color:#bcd9c6;margin-top:48px;padding:36px 0;font-size:14.5px}
footer.site a{color:#8fe0ae;text-decoration:none}
footer.site .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px}
footer.site h4{color:#fff;margin:0 0 10px}
footer.site ul{list-style:none;margin:0;padding:0}
footer.site li{margin:6px 0}
.crumbs{font-size:13.5px;color:#5b7466;padding-top:18px}
.crumbs a{color:#5b7466}
.ctaband{background:#0b2818;border-radius:18px;padding:34px 28px;text-align:center;margin:44px 0 10px}
.ctaband h2{color:#fff;margin:0 0 8px}
.ctaband p{color:#bcd9c6;margin:0 0 20px}
`;

const LOGO_SVG = `<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#25D366"/><stop offset="1" stop-color="#128C7E"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#lg)"/><path d="M36 8 L18 36 h10 L26 56 L46 26 h-11 z" fill="#06130b"/></svg>`;

const HERO_SVG = `<svg viewBox="0 0 430 300" width="430" role="img" aria-label="Flowchart of a WhatsApp bot: welcome message connecting to a menu and an FAQ auto-reply">
<defs><filter id="s" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0b2818" flood-opacity="0.10"/></filter></defs>
<path d="M205 60 C 260 60, 240 140, 285 140" fill="none" stroke="#25D366" stroke-width="3"/>
<path d="M205 60 C 250 60, 200 230, 245 230" fill="none" stroke="#25D366" stroke-width="3"/>
<g filter="url(#s)"><rect x="10" y="25" width="195" height="70" rx="14" fill="#fff"/><rect x="10" y="25" width="8" height="70" rx="4" fill="#25D366"/><text x="34" y="55" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#12301f">Welcome</text><text x="34" y="78" font-family="system-ui,sans-serif" font-size="13" fill="#5b7466">greet the customer</text></g>
<g filter="url(#s)"><rect x="285" y="105" width="140" height="70" rx="14" fill="#fff"/><rect x="285" y="105" width="8" height="70" rx="4" fill="#F5B841"/><text x="307" y="135" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#12301f">Menu</text><text x="307" y="158" font-family="system-ui,sans-serif" font-size="13" fill="#5b7466">1 · 2 · 3</text></g>
<g filter="url(#s)"><rect x="245" y="195" width="175" height="70" rx="14" fill="#fff"/><rect x="245" y="195" width="8" height="70" rx="4" fill="#4EA8DE"/><text x="269" y="225" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#12301f">FAQ Auto-Reply</text><text x="269" y="248" font-family="system-ui,sans-serif" font-size="13" fill="#5b7466">answers instantly</text></g>
</svg>`;

const NAV = `
<nav class="top" aria-label="Main">
  <a href="/whatsapp-bot-templates">Templates</a>
  <a href="/whatsapp-bot-for-restaurants">Use cases</a>
  <a href="/how-to-make-a-whatsapp-bot">Guide</a>
  <a href="/docs">Docs</a>
  <a class="cta" href="/app">Open the builder</a>
</nav>`;

const FOOTER = `
<footer class="site"><div class="wrap">
  <div class="cols">
    <div>
      <h4>FlowBot</h4>
      <p>Free drag-and-drop WhatsApp bot builder. Design it as a flowchart, test it live, launch it — or take the code with you.</p>
    </div>
    <div>
      <h4>Use cases</h4>
      <ul>
        <li><a href="/whatsapp-bot-for-restaurants">Restaurants</a></li>
        <li><a href="/whatsapp-bot-for-hotels">Hotels</a></li>
        <li><a href="/whatsapp-bot-for-ecommerce">Online stores</a></li>
      </ul>
    </div>
    <div>
      <h4>Resources</h4>
      <ul>
        <li><a href="/docs">Documentation</a></li>
        <li><a href="/how-to-make-a-whatsapp-bot">How to make a WhatsApp bot</a></li>
        <li><a href="/whatsapp-bot-templates">Free templates</a></li>
        <li><a href="/export-whatsapp-bot-code">Export bot code</a></li>
        <li><a href="/alternatives">ManyChat / Wati / Landbot alternative</a></li>
      </ul>
    </div>
    <div>
      <h4>Product</h4>
      <ul>
        <li><a href="/app">Open the builder (free)</a></li>
        <li><a href="/docs/blocks">Block reference</a></li>
        <li><a href="/#faq">FAQ</a></li>
      </ul>
    </div>
  </div>
  <p style="margin-top:26px">© ${new Date().getFullYear()} FlowBot</p>
</div></footer>`;

const CTA_BAND = `
<div class="ctaband">
  <h2>Build your WhatsApp bot in minutes — free</h2>
  <p>No signup needed to try it. Drag blocks, wire them up, test in the simulator.</p>
  <a class="cta big" href="/app">Open the free builder</a>
</div>`;

function renderPage(page) {
  const url = `${CANONICAL}${page.path}`;
  const jsonLd = [];
  if (page.path === "/") jsonLd.push(appJsonLd, websiteJsonLd, orgJsonLd);
  else jsonLd.push(breadcrumbJsonLd(page), orgJsonLd);
  if (page.faqs && page.faqs.length) jsonLd.push(faqJsonLd(page.faqs));

  const crumbs =
    page.path === "/"
      ? ""
      : `<div class="crumbs wrap"><a href="/">Home</a> › ${esc(page.crumb || page.h1)}</div>`;

  const redirectScript =
    page.path === "/"
      ? `<script>try{if(localStorage.getItem("flowbot_token")&&location.search.indexOf("stay")<0)location.replace("/app")}catch(e){}</script>`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#25D366">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="FlowBot">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${CANONICAL}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.desc)}">
<meta name="twitter:image" content="${CANONICAL}/og-image.png">
${redirectScript}
${jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="logo" href="/">${LOGO_SVG} FlowBot</a>
  ${NAV}
</div></header>
${crumbs}
<main class="wrap">
${page.body}
${page.faqs && page.faqs.length ? `<section id="faq"><h2>Frequently asked questions</h2>${faqHtml(page.faqs)}</section>` : ""}
${CTA_BAND}
</main>
${FOOTER}
</body>
</html>`;
}

/* ------------------------------ page copy ------------------------------ */

const HOME = {
  path: "/",
  crumb: "Home",
  priority: "1.0",
  changefreq: "weekly",
  title: "FlowBot — Free WhatsApp Bot Builder | Drag & Drop, No Code",
  desc: "Build a WhatsApp chatbot free with FlowBot's drag-and-drop flowchart builder: 40+ blocks, ready templates, live simulator, Meta / Twilio / Green API / Whapi launch, full code export as ZIP.",
  h1: "The free WhatsApp bot builder that lets you keep the code",
  body: `
<div class="hero">
  <div>
    <h1>Build a WhatsApp bot as a flowchart — free, no code</h1>
    <p class="lead">Drag blocks onto a canvas, wire them together, test the conversation in a live simulator, and go live on Meta's WhatsApp Cloud API, Twilio, Green API or Whapi.cloud. When you're done, export the complete bot as runnable Node.js code — it's yours.</p>
    <a class="cta big" href="/app">Open the free builder</a>
    <p class="sub">No signup needed to try it · Nothing to install · Works in your browser</p>
  </div>
  <div>${HERO_SVG}</div>
</div>

<section>
  <h2>Everything a WhatsApp business bot needs, as drag-and-drop blocks</h2>
  <p>FlowBot ships with <strong>40+ ready-made blocks</strong>: welcome messages, numbered menus, FAQ auto-replies, appointment booking, product catalogs and search, order status, payment links, CSAT ratings, language routing, business-hours logic, human handoff and more. Every block is configured with plain form fields — no code, no expressions to learn.</p>
  <div class="grid">
    <div class="card"><h3>🧩 Block Lab</h3><p>Invent your own blocks from simple steps — say, ask, set a variable, call an API, branch on a choice, or add an AI chat step. Your custom blocks appear in the palette like built-ins.</p></div>
    <div class="card"><h3>🤖 AI Builder</h3><p>Describe your bot in chat — "a bakery bot that takes cake orders" — and FlowBot drafts the whole flowchart for you. You stay in control and edit every block.</p></div>
    <div class="card"><h3>💬 Live simulator</h3><p>Chat with your bot inside the builder before you launch. Every menu, branch and variable works exactly like it will on WhatsApp.</p></div>
    <div class="card"><h3>🔌 Four providers</h3><p>One-click activation on Meta WhatsApp Cloud API, Twilio, Green API or Whapi.cloud. Webhooks are set up for you.</p></div>
    <div class="card"><h3>📦 Code export</h3><p>Download your entire bot as a ZIP of clean Node.js + Express code. Run it on your own server forever — no lock-in, no subscription.</p></div>
    <div class="card"><h3>🎯 Deterministic by default</h3><p>Flows run exactly as drawn — no AI guessing in the middle of your checkout. Add AI only where you want it, using your own Anthropic, OpenAI or Gemini key.</p></div>
    <div class="card"><h3>🌐 Website chat widget</h3><p>Paste one script tag and the same bot runs as a chat bubble on your own website — no WhatsApp account needed to get value on day one.</p></div>
    <div class="card"><h3>📊 Built-in analytics</h3><p>See conversations, messages and channels for every bot over the last 30 days — right inside the builder.</p></div>
  </div>
</section>

<section>
  <h2>Start from a real template, not a blank canvas</h2>
  <p>FlowBot includes complete, working bots you can load with one click and make your own: a <a href="/whatsapp-bot-for-restaurants">restaurant ordering bot</a>, a <a href="/whatsapp-bot-for-hotels">77-block hotel concierge</a>, an <a href="/whatsapp-bot-for-ecommerce">online store bot</a> with catalog and order tracking, a bank assistant, and a chess academy bot with class bookings. <a href="/whatsapp-bot-templates">Browse all templates →</a></p>
</section>

<section>
  <h2>How FlowBot compares</h2>
  <div class="tablewrap">
  <table>
    <tr><th></th><th>FlowBot</th><th>Typical chatbot SaaS</th></tr>
    <tr><td>Price</td><td>Free</td><td>~$15–$99/month for WhatsApp</td></tr>
    <tr><td>Try without signup</td><td>Yes — guest mode</td><td>Usually requires an account</td></tr>
    <tr><td>Own your bot's code</td><td>Yes — export full Node.js source as ZIP</td><td>No — flows live in their cloud</td></tr>
    <tr><td>Bring your own provider</td><td>Meta, Twilio, Green API, Whapi.cloud</td><td>Often a single built-in channel</td></tr>
    <tr><td>AI usage</td><td>Optional, with your own API key</td><td>Bundled, metered, marked up</td></tr>
  </table>
  </div>
  <p>Comparing specific tools? See how FlowBot stacks up as a <a href="/alternatives">free alternative to ManyChat, Wati and Landbot</a>.</p>
</section>

<section>
  <h2>From idea to live WhatsApp bot in three steps</h2>
  <ol class="steps">
    <li><strong>Design.</strong> Drag blocks onto the canvas or load a template. Wire outputs to inputs to shape the conversation.</li>
    <li><strong>Test.</strong> Open the built-in simulator and chat with your bot. Fix wording, branches and variables instantly.</li>
    <li><strong>Launch.</strong> Connect Meta WhatsApp Cloud API, Twilio, Green API or Whapi.cloud — or <a href="/export-whatsapp-bot-code">export the code</a> and host it yourself.</li>
  </ol>
  <p>New to WhatsApp bots? Read the full guide: <a href="/how-to-make-a-whatsapp-bot">How to make a WhatsApp bot (free, step by step)</a>.</p>
</section>`,
  faqs: [
    {
      q: "Is FlowBot really free?",
      a: "Yes. The builder, all 40+ blocks, templates, the live simulator, provider activation and full code export are free. The only costs that can apply are whatever your WhatsApp provider charges for messages — for example, Meta's Cloud API has a free tier for user-initiated service conversations.",
    },
    {
      q: "Do I need to know how to code?",
      a: "No. You build the bot by dragging blocks and filling in plain form fields. Coding only becomes relevant if you choose to export your bot's Node.js source code and customize it further.",
    },
    {
      q: "Which WhatsApp providers does FlowBot support?",
      a: "Four: the official Meta WhatsApp Cloud API, Twilio's WhatsApp API, Green API, and Whapi.cloud. You connect your own account, and FlowBot configures the webhook and runs your flow.",
    },
    {
      q: "Does FlowBot use AI to run my bot?",
      a: "Not unless you add it. Flows are deterministic — they run exactly as drawn, which matters for things like orders and bookings. You can optionally add an AI Reply block or an AI step in custom blocks, powered by your own Anthropic, OpenAI or Google Gemini API key.",
    },
    {
      q: "Can I export my chatbot and host it myself?",
      a: "Yes — this is FlowBot's signature feature. One click downloads a ZIP containing your complete bot as a standalone Node.js + Express project that you can run on any server. There is no lock-in.",
    },
    {
      q: "Can I try it without creating an account?",
      a: "Yes. Guest mode lets you build and simulate bots without signing up. You only need an account when you want to save bots to the cloud or activate a live WhatsApp connection.",
    },
    {
      q: "Can I put the same bot on my website?",
      a: "Yes — every bot can be embedded as a website chat widget with a single script tag. The bubble runs the exact same flow as your WhatsApp bot, so you can serve web visitors before you even connect a WhatsApp provider. You can also publish a share page where anyone can try your bot live and clone it.",
    },
  ],
};

const GUIDE = {
  path: "/how-to-make-a-whatsapp-bot",
  crumb: "How to make a WhatsApp bot",
  priority: "0.9",
  changefreq: "monthly",
  title: "How to Make a WhatsApp Bot for Free (No Coding) — 2026 Guide",
  desc: "Step-by-step guide to creating a free WhatsApp chatbot without coding: design the flow visually, test it in a simulator, connect Meta Cloud API, Twilio, Green API or Whapi, and go live.",
  h1: "How to make a WhatsApp bot — free, without coding",
  body: `
<article class="doc">
<h1>How to make a WhatsApp bot — free, without coding</h1>
<p class="lead">A WhatsApp bot answers your customers automatically — menus, FAQs, orders, bookings — 24/7 inside the app they already use. This guide shows the whole process with <a href="/">FlowBot</a>, a free drag-and-drop builder, from blank canvas to a live bot on a real number.</p>

<h2>What you need before you start</h2>
<ul>
  <li><strong>A browser.</strong> FlowBot runs entirely on the web; there is nothing to install and you can start in guest mode without an account.</li>
  <li><strong>A WhatsApp provider account (only for going live).</strong> The official route is Meta's WhatsApp Cloud API, which is free to set up and includes a free tier for service conversations. Twilio, Green API and Whapi.cloud also work and can be simpler for testing.</li>
</ul>

<h2>Step 1 — Design the conversation as a flowchart</h2>
<p>Open the <a href="/app">FlowBot builder</a> and drag blocks from the palette onto the canvas: start with a <em>Welcome Message</em>, add a <em>Menu Options</em> block ("1 — Order, 2 — Track, 3 — Talk to a human"), then wire each menu option to the blocks that handle it. There are 40+ blocks covering FAQs, bookings, catalogs, payment links, CSAT ratings, business hours and human handoff. If you'd rather not start from scratch, load one of the <a href="/whatsapp-bot-templates">free templates</a> or describe your bot to the AI Builder and edit the flowchart it drafts.</p>

<h2>Step 2 — Collect answers with variables</h2>
<p>Blocks like <em>Collect Info</em>, <em>Collect Phone</em> and <em>Ask &amp; save answer</em> store what the user types into named variables (like <code>{name}</code> or <code>{order_id}</code>) that later blocks can reuse — for example, "Thanks {name}, your order {order_id} ships today." FlowBot automatically asks for any variable a block needs but doesn't have yet.</p>

<h2>Step 3 — Test in the live simulator</h2>
<p>Click the simulator and chat with your bot exactly as a customer would. Menus, branches, variables and API calls behave identically to production, so you can fix wording and logic before anyone real talks to the bot.</p>

<h2>Step 4 — Connect a WhatsApp provider</h2>
<p>To put the bot on a real number, open the bot's activation panel and pick a provider:</p>
<ol class="steps">
  <li><strong>Meta WhatsApp Cloud API (official, recommended).</strong> Create a free app at developers.facebook.com, add the WhatsApp product, and copy your access token and phone number ID into FlowBot. FlowBot gives you the webhook URL and verify token to paste back into Meta's dashboard.</li>
  <li><strong>Twilio.</strong> Use your Account SID and Auth Token; the Twilio Sandbox is a fast way to demo a bot in minutes.</li>
  <li><strong>Green API or Whapi.cloud.</strong> These connect through a QR scan to a regular WhatsApp account — quick for small businesses and testing.</li>
</ol>

<h2>Step 5 — Go live (or take the code with you)</h2>
<p>Activate the bot and message your number — the flow you drew answers in real time. Prefer to run everything on your own server? <a href="/export-whatsapp-bot-code">Export the bot as a ZIP</a> of Node.js + Express code and deploy it anywhere. The exported bot is standalone and keeps working even if you never open FlowBot again.</p>

<h2>How much does a WhatsApp bot cost?</h2>
<p>Building the bot with FlowBot is free. Running it costs only what your provider charges: Meta's Cloud API includes a free tier for user-initiated service conversations and charges for business-initiated template messages; Twilio charges per message; Green API and Whapi.cloud sell monthly plans. Most small businesses can run a support bot for free or nearly free.</p>
</article>`,
  faqs: [
    {
      q: "Can I make a WhatsApp bot without the Business API?",
      a: "Yes — providers like Green API and Whapi.cloud connect to a normal WhatsApp account via QR code, which is fine for small-scale use and testing. For production customer support at scale, Meta's official WhatsApp Cloud API is the recommended route.",
    },
    {
      q: "How long does it take to build a WhatsApp bot?",
      a: "With a template, about 10 minutes: load it, edit the text and menu options, test in the simulator, connect a provider. A custom flow with bookings, catalogs and branching typically takes an hour or two.",
    },
    {
      q: "Do WhatsApp bots need approval from Meta?",
      a: "Your Meta Cloud API app needs a WhatsApp Business account, and business-initiated message templates require approval. Replies to users who message you first (service conversations) don't need template approval, which is what most support bots use.",
    },
    {
      q: "Can the bot hand over to a human?",
      a: "Yes — FlowBot has Human Handoff and Goodbye/Handoff blocks, plus business-hours routing so the bot can answer after hours and let staff take over during the day.",
    },
  ],
};

const RESTAURANTS = {
  path: "/whatsapp-bot-for-restaurants",
  crumb: "WhatsApp bot for restaurants",
  priority: "0.8",
  changefreq: "monthly",
  title: "WhatsApp Bot for Restaurants — Free Ordering & Menu Chatbot",
  desc: "Create a free WhatsApp ordering bot for your restaurant: digital menu, order taking, table reservations, delivery status and FAQs. Start from FlowBot's ready restaurant template.",
  h1: "A WhatsApp ordering bot for your restaurant — free",
  body: `
<article class="doc">
<h1>A WhatsApp ordering bot for your restaurant — free</h1>
<p class="lead">Your customers already use WhatsApp to ask "are you open?", "what's on the menu?" and "where's my order?". A restaurant WhatsApp bot answers instantly, takes orders and reservations, and frees your staff during rush hour. With <a href="/">FlowBot</a> you can build one visually, free, starting from a working template.</p>

<h2>What a restaurant WhatsApp bot can do</h2>
<div class="grid">
  <div class="card"><h3>📋 Digital menu</h3><p>Send your menu as a numbered list or a mini catalog with prices — customers reply with a number to order.</p></div>
  <div class="card"><h3>🛵 Order taking</h3><p>Collect the dish, quantity, address and phone number into variables, confirm the total, and notify your kitchen.</p></div>
  <div class="card"><h3>🪑 Table reservations</h3><p>An appointment-booking block collects date, time and party size, then sends a confirmation message.</p></div>
  <div class="card"><h3>⏰ Business hours</h3><p>Route conversations differently when you're closed — take pre-orders at night, hand off to staff at lunch.</p></div>
  <div class="card"><h3>❓ FAQ auto-replies</h3><p>Veg options, delivery radius, parking, UPI payment — answered instantly from keywords.</p></div>
  <div class="card"><h3>⭐ Feedback &amp; ratings</h3><p>A CSAT block asks for a 1–5 rating after the order and saves the score.</p></div>
</div>

<h2>Start from the Spice Villa template</h2>
<p>FlowBot includes a complete restaurant bot — <em>Spice Villa Restaurant</em> — with a welcome message, dish menu with prices, order collection, delivery FAQs and a goodbye handoff. Load it in the <a href="/app">builder</a>, swap in your dishes and prices, test the conversation in the simulator, and connect your WhatsApp number via Meta Cloud API, Twilio, Green API or Whapi.cloud. The whole process is drag-and-drop; see the <a href="/how-to-make-a-whatsapp-bot">step-by-step guide</a>.</p>

<h2>Why restaurants pick FlowBot</h2>
<p>It's genuinely free, there's no per-message markup on top of your provider, and if you ever want to move the bot in-house you can <a href="/export-whatsapp-bot-code">export the full source code</a> and run it on your own server. Orders follow the exact flow you drew — deterministic, with no AI improvising prices or availability.</p>
</article>`,
  faqs: [
    {
      q: "Can customers order food directly through the WhatsApp bot?",
      a: "Yes. The bot shows your menu, collects the items, quantity and delivery address into variables, confirms the order back to the customer, and can call your systems through the HTTP Request block or send a payment link.",
    },
    {
      q: "Does the bot handle table reservations too?",
      a: "Yes — the Appointment Booking and Booking Confirm blocks collect date, time and party size and send a confirmation, all inside the same flow as your menu and FAQs.",
    },
    {
      q: "What does a restaurant WhatsApp bot cost?",
      a: "FlowBot is free. You only pay your WhatsApp provider's message costs — with Meta's Cloud API, replies to customers who message you first fall under the free service-conversation tier, so a typical restaurant bot runs at little to no cost.",
    },
    {
      q: "Can I take payments in the bot?",
      a: "You can send payment links (UPI, Stripe, Razorpay or any URL) with the Payment Link block. Customers pay in the browser and the flow continues with a confirmation.",
    },
  ],
};

const HOTELS = {
  path: "/whatsapp-bot-for-hotels",
  crumb: "WhatsApp bot for hotels",
  priority: "0.8",
  changefreq: "monthly",
  title: "WhatsApp Bot for Hotels — Free Concierge & Booking Chatbot",
  desc: "Build a free hotel WhatsApp bot: room bookings, check-in info, room service, local tips and 24/7 guest FAQs. FlowBot includes a ready 77-block hotel concierge template.",
  h1: "A WhatsApp concierge for your hotel — free",
  body: `
<article class="doc">
<h1>A WhatsApp concierge for your hotel — free</h1>
<p class="lead">Guests message hotels at all hours — booking questions before arrival, Wi-Fi passwords at midnight, late checkout at 7am. A hotel WhatsApp bot answers instantly in the app guests already have, and hands off to your front desk when a human is needed. <a href="/">FlowBot</a> lets you build one for free, starting from a complete 77-block hotel template.</p>

<h2>What a hotel WhatsApp bot handles</h2>
<div class="grid">
  <div class="card"><h3>🛏️ Room enquiries &amp; booking</h3><p>Show room types with prices, collect dates and guest counts, and confirm reservations with a booking block.</p></div>
  <div class="card"><h3>🧾 Pre-arrival info</h3><p>Check-in times, directions, parking, ID requirements — answered automatically before the guest asks reception.</p></div>
  <div class="card"><h3>🍽️ Room service</h3><p>A menu flow takes in-room dining orders and forwards them to the kitchen.</p></div>
  <div class="card"><h3>🗺️ Local recommendations</h3><p>Restaurants, sights and transport tips served from a keyword FAQ, with map links.</p></div>
  <div class="card"><h3>🌐 Multilingual guests</h3><p>A language router sends guests down English/Hindi/other branches from the first message.</p></div>
  <div class="card"><h3>🤝 Front-desk handoff</h3><p>Anything the bot can't answer is routed to staff, with business-hours logic for the night shift.</p></div>
</div>

<h2>Start from the Hotel Paradise template</h2>
<p>The built-in <em>Hotel Paradise</em> template is a full 77-block concierge: welcome and language routing, room catalog with prices, booking collection, room service menu, housekeeping requests, local tips, FAQs and feedback. Load it in the <a href="/app">builder</a>, replace the copy with your hotel's details, test in the simulator, and connect your number — see <a href="/how-to-make-a-whatsapp-bot">how to go live</a>.</p>

<h2>Why hotels pick FlowBot</h2>
<p>Deterministic flows mean the bot never invents room rates or availability — it says exactly what you configured. It's free to build and run beyond provider message costs, and you can <a href="/export-whatsapp-bot-code">export the bot's code</a> to host on the hotel's own infrastructure if your IT team prefers.</p>
</article>`,
  faqs: [
    {
      q: "Can guests book rooms through the WhatsApp bot?",
      a: "Yes. The bot shows room types and prices, collects dates and guest details into variables, and confirms the booking. Through the HTTP Request block it can also push the reservation into your PMS or a Google Sheet endpoint.",
    },
    {
      q: "Can the bot answer in multiple languages?",
      a: "Yes — the Language Router block asks the guest's preferred language up front and routes them down separate branches, so you fully control the wording in each language.",
    },
    {
      q: "What happens when the bot can't answer?",
      a: "The Human Handoff block notifies your front desk and tells the guest a person will reply, and Business Hours logic can behave differently overnight versus during the day.",
    },
    {
      q: "Is the hotel template really free?",
      a: "Yes — all FlowBot templates, including the 77-block hotel concierge, are free to load, edit, simulate, launch and even export as source code.",
    },
  ],
};

const ECOMMERCE = {
  path: "/whatsapp-bot-for-ecommerce",
  crumb: "WhatsApp bot for online stores",
  priority: "0.8",
  changefreq: "monthly",
  title: "WhatsApp Bot for E-commerce — Free Store & Order-Tracking Chatbot",
  desc: "Create a free WhatsApp bot for your online store: product catalog, product search, order tracking, cart recovery, payment links and support FAQs. Ready template included.",
  h1: "A WhatsApp sales bot for your online store — free",
  body: `
<article class="doc">
<h1>A WhatsApp sales bot for your online store — free</h1>
<p class="lead">"Where is my order?" is half of every store's support inbox. A WhatsApp e-commerce bot answers it instantly, shows your catalog, recovers abandoned carts and sends payment links — inside the chat app your buyers check fifty times a day. <a href="/">FlowBot</a> gives you all of it free, with a working store template.</p>

<h2>Blocks made for selling</h2>
<div class="grid">
  <div class="card"><h3>🛍️ Product cards &amp; catalog</h3><p>Show products with price, description and link — as single deal-of-the-day cards or a browsable mini catalog.</p></div>
  <div class="card"><h3>🔎 Product search</h3><p>Customers type "sneakers" and the bot matches keywords to your catalog and replies with the right product.</p></div>
  <div class="card"><h3>🧾 Order status &amp; tracking</h3><p>Collect the order ID and reply with status and a tracking link — or fetch live status from your API with the HTTP Request block.</p></div>
  <div class="card"><h3>🛒 Cart recovery</h3><p>Nudge shoppers who didn't finish checkout with a reminder and a coupon code block.</p></div>
  <div class="card"><h3>💳 Payment links</h3><p>Send UPI, Razorpay, Stripe or any payment URL at the right step of the conversation.</p></div>
  <div class="card"><h3>↩️ Returns &amp; shipping FAQs</h3><p>Return Policy and Shipping Info blocks answer the questions that flood your inbox after every sale.</p></div>
</div>

<h2>Start from the TrendKart template</h2>
<p>The built-in <em>TrendKart Online Store</em> template comes with a product catalog, keyword product search, a deal-of-the-day product card, order tracking, return policy answers and a review request. Load it in the <a href="/app">builder</a>, plug in your products and links, test in the simulator, and connect your WhatsApp number — the <a href="/how-to-make-a-whatsapp-bot">step-by-step guide</a> covers going live on Meta, Twilio, Green API or Whapi.</p>

<h2>Why stores pick FlowBot</h2>
<p>No monthly fee and no per-conversation markup — you pay only your provider. Flows are deterministic, so prices and policies are always exactly what you wrote, and the optional AI Reply block (your own API key) can handle open-ended questions without touching your checkout logic. Outgrow the hosted builder? <a href="/export-whatsapp-bot-code">Export the code</a> and run the bot inside your own stack.</p>
</article>`,
  faqs: [
    {
      q: "Can the bot pull live order status from my store?",
      a: "Yes — the HTTP Request block can call your store's API (Shopify, WooCommerce, or your own backend) with the customer's order ID and use the response in the reply message.",
    },
    {
      q: "Can customers browse products inside WhatsApp?",
      a: "Yes. The Mini Catalog block lists products with prices as a numbered menu, Product Cards show one item with description and link, and Product Search matches free-text keywords to your catalog.",
    },
    {
      q: "Does FlowBot support COD and payment links?",
      a: "You can build both: collect address and confirm for cash on delivery, or send a Payment Link block with your UPI/Razorpay/Stripe URL for prepaid orders.",
    },
    {
      q: "How is this different from WhatsApp Business catalog?",
      a: "The native catalog is a static product list. A FlowBot flow is a conversation: it can search, recommend, track orders, recover carts, collect reviews and hand off to support — and you can export the whole thing as code.",
    },
  ],
};

const TEMPLATES = {
  path: "/whatsapp-bot-templates",
  crumb: "WhatsApp bot templates",
  priority: "0.8",
  changefreq: "monthly",
  title: "Free WhatsApp Chatbot Templates — Restaurant, Hotel, Store, Bank",
  desc: "Five free, complete WhatsApp chatbot templates: restaurant ordering, hotel concierge (77 blocks), online store, bank assistant and chess academy. Load, edit, simulate and launch.",
  h1: "Free WhatsApp chatbot templates",
  body: `
<article class="doc">
<h1>Free WhatsApp chatbot templates</h1>
<p class="lead">Every FlowBot template is a complete, working bot — not a skeleton. Load one into the <a href="/app">builder</a> with a click, swap the text and products for your own, test it in the live simulator, and launch. All templates are free, and you can <a href="/export-whatsapp-bot-code">export any of them as source code</a>.</p>

<h2>The templates</h2>
<div class="grid">
  <div class="card"><h3>🍛 Spice Villa Restaurant</h3><p>Dish menu with prices, order collection with address, delivery FAQs, feedback. The fastest way to a <a href="/whatsapp-bot-for-restaurants">restaurant ordering bot</a>.</p></div>
  <div class="card"><h3>🏨 Hotel Paradise</h3><p>A 77-block concierge: room catalog, bookings, room service, local tips, language routing, front-desk handoff. See <a href="/whatsapp-bot-for-hotels">hotel bots</a>.</p></div>
  <div class="card"><h3>🛍️ TrendKart Online Store</h3><p>Product catalog, keyword search, deal card, order tracking, returns policy, review requests. See <a href="/whatsapp-bot-for-ecommerce">e-commerce bots</a>.</p></div>
  <div class="card"><h3>🏦 SafeBank Assistant</h3><p>Balance/branch FAQs, secure-tone messaging, lead qualification for loans, human handoff for sensitive queries.</p></div>
  <div class="card"><h3>♟️ GrandMaster Chess Academy</h3><p>Course catalog with prices, batch booking, trial-class collection — a pattern that fits any classes or coaching business.</p></div>
</div>

<h2>Make it yours</h2>
<p>Templates are ordinary flows — every block can be edited, rewired or deleted, and you can add any of the 40+ built-in blocks or your own <em>Block Lab</em> creations. If none of these fit, describe your business to the AI Builder and get a custom flowchart drafted in seconds, or start from the <a href="/how-to-make-a-whatsapp-bot">step-by-step guide</a>.</p>
</article>`,
  faqs: [
    {
      q: "Are the templates really free to use commercially?",
      a: "Yes — load them, rebrand them, launch them for your business, and even export the generated source code. There are no template fees or locked tiers.",
    },
    {
      q: "Can I combine two templates?",
      a: "You can copy patterns between flows — for example, add the store template's order-tracking branch to the restaurant bot. Blocks are freely editable, so nothing is locked.",
    },
    {
      q: "Do templates work with any provider?",
      a: "Yes. A template is just a flow; when you activate the bot you can connect it to Meta WhatsApp Cloud API, Twilio, Green API or Whapi.cloud.",
    },
  ],
};

const EXPORT = {
  path: "/export-whatsapp-bot-code",
  crumb: "Export WhatsApp bot code",
  priority: "0.8",
  changefreq: "monthly",
  title: "Export Your WhatsApp Bot as Code — Node.js ZIP, Self-Hosted, Free",
  desc: "FlowBot turns your visual WhatsApp bot into a standalone Node.js + Express project you download as a ZIP. Self-host it anywhere, no lock-in, no subscription — free.",
  h1: "Design visually. Download the code. Own your bot.",
  body: `
<article class="doc">
<h1>Design visually. Download the code. Own your bot.</h1>
<p class="lead">Most chatbot platforms keep your bot hostage: the flow lives in their cloud, behind their subscription, forever. <a href="/">FlowBot</a> does the opposite — one click exports your whole WhatsApp bot as a ZIP of clean <strong>Node.js + Express</strong> source code that runs on any server you like.</p>

<h2>What's inside the ZIP</h2>
<ul>
  <li><strong>A standalone Express server</strong> with webhook endpoints wired for your provider (Meta Cloud API, Twilio, Green API or Whapi.cloud).</li>
  <li><strong>Your flow, compiled to plain code</strong> — every block you drew becomes readable logic: menus, branches, variables, API calls, payment links.</li>
  <li><strong>A deterministic session engine</strong> that tracks each customer's place in the conversation.</li>
  <li><strong>package.json and setup instructions</strong> — <code>npm install</code>, set your provider credentials, <code>npm start</code>.</li>
</ul>

<h2>Why exporting matters</h2>
<p>Owning the code means <strong>no lock-in</strong> (cancel nothing — there's nothing to cancel), <strong>no per-message platform markup</strong> (you pay only your provider), <strong>real customization</strong> (your developers can extend the generated code with anything Node.js can do), and <strong>compliance freedom</strong> (host in your own country, VPC or on-prem box — useful for banks and healthcare).</p>

<h2>How to export your bot</h2>
<ol class="steps">
  <li>Build or load a bot in the <a href="/app">free builder</a> — start from a <a href="/whatsapp-bot-templates">template</a> if you like.</li>
  <li>Test the conversation in the live simulator until it behaves exactly right.</li>
  <li>Click <em>Export code</em> — you get a ZIP with the complete project.</li>
  <li>Deploy it on Railway, Render, a VPS, or your own hardware; point your provider's webhook at it, and it's live.</li>
</ol>
<p>You can keep using the visual builder as your editor: tweak the flow, re-export, redeploy. Or fork the code and never look back — it's yours either way.</p>
</article>`,
  faqs: [
    {
      q: "What language is the exported bot written in?",
      a: "JavaScript — a standalone Node.js project using Express for the webhook server. It has minimal dependencies and runs anywhere Node 18+ runs.",
    },
    {
      q: "Does the exported bot still need FlowBot to run?",
      a: "No. The ZIP is fully self-contained: your flow, the session engine and the provider webhook are all compiled into the project. FlowBot's servers are not involved at runtime.",
    },
    {
      q: "Can my developer modify the exported code?",
      a: "Yes, that's the point — the generated code is plain, readable JavaScript. Add database calls, custom integrations, logging, anything. It's a normal Node.js codebase after export.",
    },
    {
      q: "Is code export a paid feature?",
      a: "No. Export is free, like the rest of FlowBot.",
    },
  ],
};

const ALTERNATIVES = {
  path: "/alternatives",
  crumb: "Free alternative to ManyChat, Wati & Landbot",
  priority: "0.8",
  changefreq: "monthly",
  title: "Free Alternative to ManyChat, Wati & Landbot for WhatsApp Bots",
  desc: "Looking for a free WhatsApp bot builder? Compare FlowBot with ManyChat, Wati and Landbot: pricing, code export, provider choice and lock-in — and what each tool is best at.",
  h1: "A free alternative to ManyChat, Wati and Landbot — for WhatsApp",
  body: `
<article class="doc">
<h1>A free alternative to ManyChat, Wati and Landbot — for WhatsApp</h1>
<p class="lead">ManyChat, Wati and Landbot are polished platforms — but for WhatsApp specifically, their useful tiers are paid, and your bot lives in their cloud. <a href="/">FlowBot</a> takes a different deal: the builder is free, you bring your own WhatsApp provider, and you can export your bot's full source code at any time. Here's an honest comparison.</p>

<h2>The short version</h2>
<div class="tablewrap">
<table>
  <tr><th></th><th>FlowBot</th><th>ManyChat</th><th>Wati</th><th>Landbot</th></tr>
  <tr><td>WhatsApp on the free tier</td><td>Yes — bring your own provider</td><td>No — WhatsApp needs the paid Pro plan</td><td>No — subscription platform</td><td>Limited trial chats</td></tr>
  <tr><td>Visual flow builder</td><td>Yes (flowchart canvas)</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
  <tr><td>Export bot as source code</td><td><strong>Yes — full Node.js ZIP</strong></td><td>No</td><td>No</td><td>No</td></tr>
  <tr><td>Provider choice</td><td>Meta, Twilio, Green API, Whapi</td><td>Built-in WhatsApp channel</td><td>Built on WhatsApp Business API</td><td>Built-in channels</td></tr>
  <tr><td>Best at</td><td>Free WhatsApp bots you own</td><td>Instagram/Facebook marketing automation</td><td>WhatsApp marketing &amp; team inbox at scale</td><td>Web + WhatsApp chat funnels</td></tr>
</table>
</div>
<p style="font-size:13.5px;color:#5b7466">Competitor plans and pricing change — always check their sites for current details. Summary reflects publicly available plan information as of mid-2026.</p>

<h2>When FlowBot is the right choice</h2>
<p>Pick FlowBot if you want a <strong>WhatsApp bot without a monthly platform fee</strong>, you're comfortable connecting your own provider account (a 10-minute job — <a href="/how-to-make-a-whatsapp-bot">guide here</a>), and you value an exit route: the <a href="/export-whatsapp-bot-code">code export</a> means you can leave the platform and keep the bot. It's also the better fit when flows must be deterministic — orders, bookings and bank-style FAQs run exactly as drawn, with AI strictly optional and powered by your own key.</p>

<h2>When the others are the right choice</h2>
<p>Pick <strong>ManyChat</strong> if your automation lives mainly on Instagram and Facebook and WhatsApp is a side channel. Pick <strong>Wati</strong> if you need a shared team inbox, broadcast campaigns and marketing tooling around the WhatsApp Business API and the subscription pays for itself. Pick <strong>Landbot</strong> if website chat funnels are your priority and WhatsApp is one of several channels. FlowBot focuses on one thing: building WhatsApp bots you fully own.</p>

<h2>Migrating is low-risk</h2>
<p>Because FlowBot is free and works in guest mode, you can rebuild your current bot's flow in an afternoon and run it side-by-side before switching anything. Start from a <a href="/whatsapp-bot-templates">template</a> close to your use case, or paste your bot's script into the AI Builder and edit the flowchart it drafts.</p>
</article>`,
  faqs: [
    {
      q: "Is FlowBot completely free while ManyChat and Wati are paid?",
      a: "FlowBot's builder, templates, simulator and code export are free; you pay only your WhatsApp provider's message costs. ManyChat's WhatsApp channel requires its paid Pro plan, and Wati is a subscription platform. Their prices change, so check their sites for current numbers.",
    },
    {
      q: "What do I give up by choosing FlowBot?",
      a: "FlowBot doesn't include a team inbox, broadcast campaign tooling or Instagram/Facebook channels — it's focused on building and running WhatsApp conversation flows. If you need heavy marketing tooling, a paid platform may serve you better.",
    },
    {
      q: "Can I import my existing bot from another platform?",
      a: "There's no one-click importer, but flows rebuild quickly: describe your existing bot to the AI Builder to get a draft flowchart, then refine it on the canvas and verify in the simulator.",
    },
  ],
};

const pages = [HOME, GUIDE, RESTAURANTS, HOTELS, ECOMMERCE, TEMPLATES, EXPORT, ALTERNATIVES];

/* ------------------------- sitemap + llms.txt ------------------------- */

const sitemapXml = (extra = []) => {
  const urls = [
    ...pages.map(
      (p) =>
        `  <url>\n    <loc>${CANONICAL}${p.path}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    ),
    ...extra.map(
      (p) =>
        `  <url>\n    <loc>${CANONICAL}${p.path}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    ),
    `  <url>\n    <loc>${CANONICAL}/app</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
};

const llmsTxt = (extraDocs = []) => `# FlowBot

> FlowBot (${CANONICAL}) is a free, visual drag-and-drop WhatsApp bot builder. Users design chatbot flows on a flowchart canvas with 40+ ready blocks, build custom blocks in the Block Lab, draft bots with an AI Builder chat, test in a live simulator, launch on Meta WhatsApp Cloud API, Twilio, Green API or Whapi.cloud, and can export the complete bot as a standalone Node.js + Express project (ZIP). Flows are deterministic by default; AI blocks are optional and use the user's own Anthropic/OpenAI/Gemini API key.

Key facts:
- Price: free (users pay only their WhatsApp provider's message costs)
- No signup needed to try (guest mode)
- Unique feature: full source-code export — no lock-in
- Bots also run as an embeddable website chat widget (one script tag) and get public share pages others can try live and clone
- Built-in per-bot analytics (conversations, messages, channels)
- Templates: restaurant, hotel (77 blocks), online store, bank, chess academy

## Pages

${pages.map((p) => `- [${p.title}](${CANONICAL}${p.path || "/"}): ${p.desc}`).join("\n")}
- [FlowBot Studio (the builder app)](${CANONICAL}/app): The visual builder itself — canvas, simulator, provider activation.
${extraDocs.length ? `\n## Docs\n\n${extraDocs.map((d) => `- [${d.title}](${CANONICAL}${d.path}): ${d.desc}`).join("\n")}\n` : ""}`;

module.exports = { pages, renderPage, sitemapXml, llmsTxt, CANONICAL, LASTMOD, CSS, NAV, FOOTER, LOGO_SVG };
