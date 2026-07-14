// ============================================================
// Competitor comparison hub — dedicated "X alternative" pages that
// capture brand-name searches for the big WhatsApp bot platforms.
// Rendered with seo.renderPage so chrome/JSON-LD/FAQ stay consistent.
// Copy is deliberately honest: competitor pricing shifts and each tool
// genuinely wins at some things — we state that and point our own
// wedge (free builder + code export + bring-your-own-provider).
// ============================================================

const seo = require("./seo");
const { CANONICAL } = seo;

// A shared, honest disclaimer for every comparison page (pricing moves).
const DISCLAIMER = `<p style="font-size:13px;color:#5b7466">Competitor plans, pricing and features change often — always check the vendor's own site for current details. Comparisons below reflect publicly available information as of mid-2026 and our reading of each product's positioning.</p>`;

// Reusable "what FlowBot is" one-liner + honest tradeoff, so every page is
// consistent about what we do and don't do.
const TRADEOFF = `<h2>Where FlowBot is <em>not</em> the answer</h2>
<p>FlowBot is a free builder for the bot itself — it doesn't bundle a managed shared team inbox, a broadcast/campaign manager, or official Business Solution Provider (BSP) onboarding and support. You bring your own WhatsApp provider (Meta Cloud API, Twilio, Green API or Whapi.cloud). If you specifically need an all-in-one managed platform with agents, campaigns and hand-holding, a paid provider can be worth the money. If you want to build and own the bot logic for free, that's exactly what FlowBot is for.</p>`;

const CTA_NOTE = `<p>Try it in minutes — no signup needed to build and simulate: <a href="/app">open the free builder</a>, or read <a href="/how-to-make-a-whatsapp-bot">how to make a WhatsApp bot</a>.</p>`;

// Build a comparison table from rows: [feature, flowbot, competitor]
const table = (competitor, rows) => `<div class="tablewrap"><table>
<tr><th></th><th>FlowBot</th><th>${competitor}</th></tr>
${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("\n")}
</table></div>`;

/* ------------------------------ hub page ------------------------------ */

const HUB = {
  path: "/whatsapp-bot-comparisons",
  crumb: "WhatsApp bot builder comparisons",
  priority: "0.8",
  changefreq: "monthly",
  title: "FlowBot vs Wati, AiSensy, Interakt, ManyChat, Landbot & Gallabox",
  desc: "Honest comparisons of FlowBot with the major WhatsApp bot platforms — Wati, AiSensy, Interakt, ManyChat, Landbot, Gallabox. See pricing, code ownership, provider choice and when each tool wins.",
  h1: "How FlowBot compares to other WhatsApp bot platforms",
  body: `
<p class="lead">Most WhatsApp bot tools are paid, managed platforms that keep your bot in their cloud. <a href="/">FlowBot</a> is different: the builder is free, you bring your own WhatsApp provider, and you can export your bot's full source code at any time. Here's how it stacks up against the tools people compare it with — with an honest note on when each competitor is the better pick.</p>

<div class="grid">
  <div class="card"><h3><a href="/wati-alternative">FlowBot vs Wati</a></h3><p>The free alternative to Wati — no monthly platform fee and no per-message markup.</p></div>
  <div class="card"><h3><a href="/aisensy-alternative">FlowBot vs AiSensy</a></h3><p>AiSensy is a managed BSP; FlowBot is a builder you own and can export.</p></div>
  <div class="card"><h3><a href="/interakt-alternative">FlowBot vs Interakt</a></h3><p>Skip quarterly commitments — build free and keep the code.</p></div>
  <div class="card"><h3><a href="/manychat-alternative">FlowBot vs ManyChat</a></h3><p>WhatsApp-first and free, where ManyChat gates WhatsApp behind its paid plan.</p></div>
  <div class="card"><h3><a href="/landbot-alternative">FlowBot vs Landbot</a></h3><p>A free, code-exportable take on Landbot's visual flow builder.</p></div>
  <div class="card"><h3><a href="/gallabox-alternative">FlowBot vs Gallabox</a></h3><p>Same no-code promise, without the subscription or lock-in.</p></div>
</div>

<h2>The one-line summary</h2>
<p>If you want a <strong>managed all-in-one platform</strong> — shared team inbox, broadcast campaigns, official BSP support — a paid provider like Wati, AiSensy or Interakt earns its fee. If you want to <strong>build a WhatsApp bot for free and own it</strong> — export the code, host it anywhere, bring any provider — that's FlowBot. Many businesses even use both: FlowBot to design and own the conversation logic, a BSP for broadcasts.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "What makes FlowBot different from Wati, AiSensy and Interakt?", a: "Those are managed WhatsApp Business Solution Providers — your bot and conversations live in their cloud on a monthly plan. FlowBot is a free visual builder: you design the bot, bring your own provider (Meta, Twilio, Green API or Whapi), and can export the complete Node.js source code with no lock-in." },
    { q: "Is FlowBot actually free compared to these tools?", a: "The FlowBot builder, templates, simulator, website widget and code export are free; you pay only your WhatsApp provider's message costs. Most competitors charge a monthly platform fee (and some add a markup on Meta's message rates on top)." },
    { q: "Can I move off a competitor to FlowBot easily?", a: "Yes — FlowBot works in guest mode with no signup, so you can rebuild your flow in an afternoon and run it side by side. Start from a template close to your use case, or describe your existing bot to the AI Builder and edit the flowchart it drafts." },
  ],
};

/* --------------------------- competitor pages --------------------------- */

const WATI = {
  path: "/wati-alternative",
  crumb: "Wati alternative",
  priority: "0.8",
  changefreq: "monthly",
  title: "Free Wati Alternative — FlowBot WhatsApp Bot Builder (No Markup)",
  desc: "Looking for a Wati alternative? FlowBot builds WhatsApp bots free — no monthly platform fee, no per-message markup, and you can export the full code. See the honest comparison.",
  h1: "A free Wati alternative for WhatsApp bots",
  body: `
<p class="lead">Wati is a polished, managed WhatsApp platform — but it's a subscription, its plans add a markup on Meta's per-message rates, and chatbot automation sits on the higher tiers. If you mainly want to <em>build and run a WhatsApp bot</em> without a monthly fee, <a href="/">FlowBot</a> is a free alternative you actually own.</p>

${table("Wati", [
  ["Price to build bots", "Free", "Paid monthly plans; automation on higher tiers"],
  ["Markup on Meta message rates", "None — you bring your own provider", "Platform markup on conversation rates"],
  ["Own your bot's code", "Yes — export full Node.js source", "No — flows stay in Wati's cloud"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi.cloud", "Managed BSP channel"],
  ["Try without signup", "Yes — guest mode", "Account required"],
  ["Best at", "Free bots you own + no lock-in", "Team inbox, CRM integrations, managed support"],
])}
${DISCLAIMER}

<h2>Why teams look for a Wati alternative</h2>
<p>The usual reasons: the monthly cost adds up, chatbot automation is priced separately from the base plan, and the bot lives in Wati's cloud so leaving means rebuilding. FlowBot removes all three — the builder is free, automation (menus, flows, API calls, AI) is the whole product, and <a href="/export-whatsapp-bot-code">code export</a> means you can walk away with your bot any time.</p>

${TRADEOFF}
<p>Wati genuinely shines as a managed platform with a shared team inbox, broadcast campaigns and deep CRM integrations (Zoho, HubSpot, Salesforce). If those are your priority and the subscription pays for itself, Wati is a fair choice. For a free, ownable bot builder, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot really free compared to Wati?", a: "Yes — building, testing, the website widget and code export are free. You pay only your WhatsApp provider's message costs, with no platform markup on top. Wati charges a monthly plan and its conversation rates include a markup over Meta's." },
    { q: "Does FlowBot have a shared team inbox like Wati?", a: "No. FlowBot focuses on building and running the bot; it doesn't include a managed multi-agent inbox or broadcast campaign manager. If you need those, Wati or another managed BSP is a better fit — but many teams pair FlowBot's free bot logic with a provider for broadcasts." },
    { q: "Can I export my bot if I outgrow FlowBot?", a: "Yes — one click downloads your bot as a standalone Node.js + Express project you can host anywhere. There's no lock-in, which is the main thing you can't do on Wati." },
  ],
};

const AISENSY = {
  path: "/aisensy-alternative",
  crumb: "AiSensy alternative",
  priority: "0.8",
  changefreq: "monthly",
  title: "AiSensy Alternative — Free WhatsApp Bot Builder You Own (FlowBot)",
  desc: "An AiSensy alternative for people who want to own their bot: FlowBot is a free WhatsApp bot builder with full code export and your choice of provider — not a managed BSP cloud.",
  h1: "An AiSensy alternative you can own",
  body: `
<p class="lead">AiSensy is one of India's most popular WhatsApp platforms, with a free tier and no markup on Meta's rates — genuinely good value as a managed BSP. The difference with <a href="/">FlowBot</a> isn't just price: AiSensy hosts your bot and campaigns in its cloud, while FlowBot lets you <em>own the bot</em> — export the code and bring any provider.</p>

${table("AiSensy", [
  ["Model", "Free builder you own", "Managed BSP (their cloud)"],
  ["Build bots for free", "Yes", "Free plan available; features tiered"],
  ["Own / export the code", "Yes — full Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "AiSensy as your BSP"],
  ["Broadcasts & campaign analytics", "Not built in", "Yes — core strength"],
  ["Best at", "Owning bot logic, no lock-in", "Managed broadcasts + INR billing"],
])}
${DISCLAIMER}

<h2>When to choose which</h2>
<p>Choose <strong>AiSensy</strong> if you want a managed Indian BSP with broadcast campaigns, campaign analytics and native INR billing, and you're happy for the bot to live in their platform. Choose <strong>FlowBot</strong> if you want to design the bot for free, keep it deterministic, and <a href="/export-whatsapp-bot-code">export the source code</a> so you're never locked in — connecting AiSensy-style delivery through your own Meta Cloud API number if you like.</p>

${TRADEOFF}
${CTA_NOTE}`,
  faqs: [
    { q: "AiSensy already has a free plan — why use FlowBot?", a: "AiSensy's free plan is a managed cloud where your bot and data live on their platform. FlowBot is free too, but you own the bot: you can export the complete source code and run it on your own server, and you connect your own WhatsApp provider. It's about ownership and lock-in, not only price." },
    { q: "Does FlowBot do broadcasts and campaigns like AiSensy?", a: "No — broadcast campaigns and campaign analytics are AiSensy's strength and aren't built into FlowBot, which focuses on the conversation flow. Some teams use FlowBot for the bot and a BSP for broadcasts." },
    { q: "Can FlowBot use the official WhatsApp Cloud API like AiSensy?", a: "Yes. FlowBot connects to Meta's official WhatsApp Cloud API directly (plus Twilio, Green API and Whapi), so you get the official channel without a platform in between." },
  ],
};

const INTERAKT = {
  path: "/interakt-alternative",
  crumb: "Interakt alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Interakt Alternative — Free, Code-Ownable WhatsApp Bot Builder",
  desc: "An Interakt alternative without quarterly commitments: FlowBot builds WhatsApp bots free, connects your own provider, and exports the full code. Honest side-by-side comparison.",
  h1: "A free Interakt alternative",
  body: `
<p class="lead">Interakt is a solid managed platform, especially for D2C e-commerce, but it's billed on quarterly plans and your bot lives in its cloud. <a href="/">FlowBot</a> is a free, monthly-commitment-free way to build a WhatsApp bot you can export and own.</p>

${table("Interakt", [
  ["Pricing", "Free builder", "Quarterly plans"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "Managed BSP"],
  ["Try without signup", "Yes", "Account required"],
  ["Best at", "Free ownable bots", "D2C e-commerce, unified WhatsApp + Instagram"],
])}
${DISCLAIMER}

<h2>Why look past Interakt</h2>
<p>If quarterly billing and cloud lock-in don't suit you — or you just want to prototype a bot for free first — FlowBot lets you build and simulate with no signup, then go live on your own <a href="/how-to-make-a-whatsapp-bot">WhatsApp provider</a>. For an online store, our <a href="/whatsapp-bot-for-ecommerce">e-commerce bot guide</a> covers catalog, order tracking and payment links.</p>

${TRADEOFF}
<p>Interakt is worth paying for if you want its unified WhatsApp + Instagram handling and D2C tooling in one managed dashboard. For a free, exportable bot builder, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot cheaper than Interakt?", a: "FlowBot's builder is free; you pay only your WhatsApp provider's message costs. Interakt is billed on quarterly plans. If cost and avoiding lock-in matter most, FlowBot is the lighter option." },
    { q: "Does FlowBot handle Instagram like Interakt?", a: "No — Interakt's unified WhatsApp + Instagram handling is a genuine differentiator. FlowBot is WhatsApp-focused (with an optional website chat widget). If Instagram is central to you, Interakt fits better." },
    { q: "Can I try FlowBot before committing?", a: "Yes — no signup needed to build and simulate a full bot. You only create an account when you want to save it or connect a live number." },
  ],
};

const MANYCHAT = {
  path: "/manychat-alternative",
  crumb: "ManyChat alternative",
  priority: "0.8",
  changefreq: "monthly",
  title: "ManyChat Alternative for WhatsApp — Free Bot Builder (FlowBot)",
  desc: "A ManyChat alternative focused on WhatsApp: FlowBot builds WhatsApp bots free (ManyChat gates WhatsApp behind its paid plan), with code export and your own provider.",
  h1: "A WhatsApp-first ManyChat alternative",
  body: `
<p class="lead">ManyChat is excellent for Instagram and Facebook Messenger marketing — but WhatsApp sits on its paid Pro plan, and your flows live in ManyChat's cloud. If WhatsApp is your main channel, <a href="/">FlowBot</a> builds it for free and lets you export the code.</p>

${table("ManyChat", [
  ["WhatsApp on the free tier", "Yes — bring your own provider", "No — WhatsApp needs the paid Pro plan"],
  ["Primary channels", "WhatsApp (+ website widget)", "Instagram, Facebook, WhatsApp"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "Built-in WhatsApp channel"],
  ["Best at", "Free WhatsApp bots you own", "Instagram / Facebook marketing automation"],
])}
${DISCLAIMER}

<h2>WhatsApp-first vs social-first</h2>
<p>ManyChat's centre of gravity is Instagram and Messenger growth tools; WhatsApp is a paid add-on. FlowBot is built around WhatsApp — 40+ blocks for menus, catalogs, bookings, FAQs and handoff — and it's free, with an optional <a href="/docs/widget-and-sharing">website chat widget</a> so you can serve web visitors too.</p>

${TRADEOFF}
<p>If your automation lives mainly on Instagram and Facebook, stay with ManyChat. If WhatsApp is the priority and you want it free and ownable, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Does ManyChat support WhatsApp for free?", a: "ManyChat's WhatsApp channel requires its paid Pro plan; the free tier centres on Instagram and Facebook. FlowBot's WhatsApp builder is free — you pay only your provider's message costs." },
    { q: "Is FlowBot a full ManyChat replacement?", a: "Not for Instagram/Facebook marketing — that's ManyChat's strength. FlowBot replaces the WhatsApp-bot part of the job, for free, and adds code export and provider choice." },
    { q: "Can FlowBot also work on my website?", a: "Yes — every FlowBot bot can run as an embeddable website chat widget with one script tag, so the same flow serves WhatsApp and your site." },
  ],
};

const LANDBOT = {
  path: "/landbot-alternative",
  crumb: "Landbot alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Landbot Alternative — Free WhatsApp Flow Builder with Code Export",
  desc: "A Landbot alternative: FlowBot is a free visual WhatsApp bot builder with a flowchart canvas, live simulator and full code export — no per-chat limits on building.",
  h1: "A free Landbot alternative",
  body: `
<p class="lead">Landbot popularised the visual, block-by-block chat builder — but its free tier is limited and WhatsApp bots live in Landbot's cloud. <a href="/">FlowBot</a> gives you the same drag-and-drop flowchart approach for free, plus something Landbot doesn't: export your bot as source code.</p>

${table("Landbot", [
  ["Visual flow builder", "Yes — flowchart canvas", "Yes"],
  ["Free building", "Yes — full builder", "Limited free chats"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "Built-in channels"],
  ["Best at", "Free WhatsApp bots you own", "Web + WhatsApp chat funnels"],
])}
${DISCLAIMER}

<h2>Same idea, free and ownable</h2>
<p>If you like Landbot's visual approach but want it free and without lock-in, FlowBot maps over cleanly: drag blocks, wire the conversation, test in the <a href="/docs/getting-started">live simulator</a>, and launch on your own provider — or <a href="/export-whatsapp-bot-code">export the code</a>. There's no per-chat cap on building and testing.</p>

${TRADEOFF}
<p>Landbot remains strong for polished website chat funnels across several channels. For a free, exportable WhatsApp-first builder, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "How is FlowBot different from Landbot?", a: "Both are visual builders. FlowBot is free to build with no per-chat cap, is WhatsApp-first, and lets you export your bot as standalone Node.js code — which Landbot doesn't offer." },
    { q: "Does FlowBot have a website chatbot like Landbot?", a: "Yes — FlowBot bots can be embedded as a website chat widget with one script tag, running the same flow as your WhatsApp bot." },
    { q: "Is FlowBot's builder really free?", a: "Yes — the builder, templates, simulator, widget and code export are free; you pay only your WhatsApp provider's message costs." },
  ],
};

const GALLABOX = {
  path: "/gallabox-alternative",
  crumb: "Gallabox alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Gallabox Alternative — Free No-Code WhatsApp Bot Builder (FlowBot)",
  desc: "A Gallabox alternative with the same no-code promise minus the subscription and lock-in: FlowBot builds WhatsApp bots free, connects your provider, and exports the code.",
  h1: "A free Gallabox alternative",
  body: `
<p class="lead">Gallabox is a well-regarded no-code WhatsApp platform for Indian businesses — managed, with a team inbox and BSP channel. <a href="/">FlowBot</a> keeps the no-code promise but flips the model: free to build, your own provider, and full code export.</p>

${table("Gallabox", [
  ["No-code builder", "Yes — drag & drop flowchart", "Yes"],
  ["Price to build", "Free", "Paid plans"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "Managed BSP"],
  ["Best at", "Free ownable bots", "Managed inbox + sales team workflows"],
])}
${DISCLAIMER}

<h2>No-code, without the lock-in</h2>
<p>Gallabox bundles a managed inbox and sales workflows on a subscription. If you want just the bot — built visually, for free, and yours to keep — FlowBot is the leaner path: build with no signup, launch on your own <a href="/how-to-make-a-whatsapp-bot">WhatsApp provider</a>, and <a href="/export-whatsapp-bot-code">export the code</a> whenever you want.</p>

${TRADEOFF}
<p>If your team needs Gallabox's shared inbox and lead workflows in one managed place, it's worth the subscription. For a free, ownable no-code bot, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot a free Gallabox alternative?", a: "Yes — FlowBot's no-code builder, templates, simulator and code export are free; you pay only your WhatsApp provider's message costs. Gallabox is a paid managed platform." },
    { q: "Does FlowBot include a team inbox like Gallabox?", a: "No — a managed shared inbox and sales workflows are Gallabox's strength. FlowBot focuses on building and owning the bot; pair it with a provider if you need agent inboxes." },
    { q: "Can I keep my bot if I stop using FlowBot?", a: "Yes — export it as a standalone Node.js project and run it anywhere. No lock-in, which is the core difference from a managed BSP like Gallabox." },
  ],
};

const pages = [HUB, WATI, AISENSY, INTERAKT, MANYCHAT, LANDBOT, GALLABOX];

// sitemap/llms entries (same shape docs.entries uses)
const entries = pages.map((p) => ({ path: p.path, title: p.title, desc: p.desc, priority: p.priority, changefreq: p.changefreq }));

module.exports = { pages, entries };
