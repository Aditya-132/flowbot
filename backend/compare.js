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
<p>FlowBot is a free builder for the bot itself. It includes a live inbox with human takeover, per-block funnel analytics and simple broadcasts — but not a multi-agent team inbox with assignment rules, a full campaign manager, or official Business Solution Provider (BSP) onboarding and support. You bring your own WhatsApp provider (Meta Cloud API, Twilio, Green API or Whapi.cloud). If you specifically need an all-in-one managed platform with agent teams, campaign tooling and hand-holding, a paid provider can be worth the money. If you want to build and own the bot logic for free, that's exactly what FlowBot is for.</p>`;

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
  title: "FlowBot vs Wati, AiSensy, Tidio, Chatfuel, Twilio Studio & More",
  desc: "Honest comparisons of FlowBot with 16 WhatsApp bot platforms — Wati, AiSensy, Interakt, ManyChat, Landbot, Gallabox, Twilio Studio, Chatfuel, Tidio, Botpress, Respond.io, SleekFlow, Zoko, DoubleTick, Yellow.ai and the WhatsApp Business App.",
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
  <div class="card"><h3><a href="/twilio-studio-alternative">FlowBot vs Twilio Studio</a></h3><p>Keep your Twilio number, drop the per-execution metering.</p></div>
  <div class="card"><h3><a href="/whatsapp-business-app-vs-bot">FlowBot vs WhatsApp Business App</a></h3><p>When Meta's free auto-replies stop being enough — upgrade to a real bot, still free.</p></div>
  <div class="card"><h3><a href="/chatfuel-alternative">FlowBot vs Chatfuel</a></h3><p>WhatsApp free where Chatfuel charges — and the code is yours.</p></div>
  <div class="card"><h3><a href="/tidio-alternative">FlowBot vs Tidio</a></h3><p>The bot without the helpdesk subscription — WhatsApp-first, widget included.</p></div>
  <div class="card"><h3><a href="/botpress-alternative">FlowBot vs Botpress</a></h3><p>Deterministic and simple where Botpress is agentic and complex.</p></div>
  <div class="card"><h3><a href="/respond-io-alternative">FlowBot vs Respond.io</a></h3><p>The automation without the per-seat inbox pricing.</p></div>
  <div class="card"><h3><a href="/sleekflow-alternative">FlowBot vs SleekFlow</a></h3><p>The conversational core of social commerce, free.</p></div>
  <div class="card"><h3><a href="/zoko-alternative">FlowBot vs Zoko</a></h3><p>Store conversations free; Zoko keeps the Shopify checkout crown.</p></div>
  <div class="card"><h3><a href="/doubletick-alternative">FlowBot vs DoubleTick</a></h3><p>The bot side of WhatsApp sales, without per-user pricing.</p></div>
  <div class="card"><h3><a href="/yellow-ai-alternative">FlowBot vs Yellow.ai</a></h3><p>The small-business answer to an enterprise platform.</p></div>
</div>

<h2>Comparing two other platforms?</h2>
<p>Head-to-head guides for the shortlists we see most often — an honest verdict for both sides, plus the free third option: <a href="/wati-vs-aisensy">Wati vs AiSensy</a> · <a href="/wati-vs-interakt">Wati vs Interakt</a> · <a href="/wati-vs-gallabox">Wati vs Gallabox</a> · <a href="/aisensy-vs-interakt">AiSensy vs Interakt</a> · <a href="/aisensy-vs-gallabox">AiSensy vs Gallabox</a> · <a href="/interakt-vs-gallabox">Interakt vs Gallabox</a></p>

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
    { q: "Does FlowBot have a shared team inbox like Wati?", a: "FlowBot includes a live inbox where you can read every conversation, take over from the bot and reply yourself, plus simple broadcasts — free. What it doesn't have is Wati's multi-agent team features (assignment, roles, SLAs). If you run a support team, Wati fits better; for an owner-operator, FlowBot's inbox usually covers it." },
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
  ["Broadcasts & campaign analytics", "Simple broadcasts + funnel analytics", "Full campaign manager — core strength"],
  ["Best at", "Owning bot logic, no lock-in", "Managed broadcasts + INR billing"],
])}
${DISCLAIMER}

<h2>When to choose which</h2>
<p>Choose <strong>AiSensy</strong> if you want a managed Indian BSP with broadcast campaigns, campaign analytics and native INR billing, and you're happy for the bot to live in their platform. Choose <strong>FlowBot</strong> if you want to design the bot for free, keep it deterministic, and <a href="/export-whatsapp-bot-code">export the source code</a> so you're never locked in — connecting AiSensy-style delivery through your own Meta Cloud API number if you like.</p>

${TRADEOFF}
${CTA_NOTE}`,
  faqs: [
    { q: "AiSensy already has a free plan — why use FlowBot?", a: "AiSensy's free plan is a managed cloud where your bot and data live on their platform. FlowBot is free too, but you own the bot: you can export the complete source code and run it on your own server, and you connect your own WhatsApp provider. It's about ownership and lock-in, not only price." },
    { q: "Does FlowBot do broadcasts and campaigns like AiSensy?", a: "FlowBot has simple broadcasts (one message to everyone who has chatted with your bot) and per-block funnel analytics, free. AiSensy's full campaign manager — segmented audiences, retargeting, campaign-level analytics — is still its strength. Heavy campaign users often pair FlowBot's bot with a BSP for marketing pushes." },
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
    { q: "Does FlowBot include a team inbox like Gallabox?", a: "FlowBot has a free live inbox with human takeover — you see every conversation and can jump in for the bot. Gallabox's strength is the multi-agent version: shared team inbox, assignment and sales workflows. Solo operators are usually fine with FlowBot; agent teams may want Gallabox." },
    { q: "Can I keep my bot if I stop using FlowBot?", a: "Yes — export it as a standalone Node.js project and run it anywhere. No lock-in, which is the core difference from a managed BSP like Gallabox." },
  ],
};

const TWILIO_STUDIO = {
  path: "/twilio-studio-alternative",
  crumb: "Twilio Studio alternative",
  priority: "0.8",
  changefreq: "monthly",
  title: "Twilio Studio Alternative — Free WhatsApp Flow Builder (FlowBot)",
  desc: "A Twilio Studio alternative for WhatsApp bots: FlowBot is a free visual flow builder that runs on your own Twilio account — no per-execution pricing, and you can export the code.",
  h1: "A free Twilio Studio alternative that still runs on Twilio",
  body: `
<p class="lead">Twilio Studio is Twilio's own visual flow builder — powerful, but executions are metered and flows live inside Twilio's console. Here's the twist: <a href="/">FlowBot</a> plugs into <em>your own Twilio account</em> as the WhatsApp channel, so you keep Twilio's delivery while building the bot in a free canvas you can export.</p>

${table("Twilio Studio", [
  ["Price to build & run flows", "Free builder — you pay only Twilio message costs", "Metered per flow execution beyond the free allowance"],
  ["Works with your Twilio number", "Yes — Twilio is a first-class provider", "Yes"],
  ["Own / export the code", "Yes — standalone Node.js ZIP", "Flows live in Twilio's console"],
  ["WhatsApp-specific blocks", "40+ (menus, catalogs, bookings, FAQ, handoff)", "General-purpose widgets"],
  ["Beyond WhatsApp", "Website chat widget", "Voice, SMS, IVR — full Twilio ecosystem"],
  ["Best at", "Free WhatsApp bots you own", "Multi-channel telephony automation"],
])}
${DISCLAIMER}

<h2>Same Twilio number, different builder</h2>
<p>If you're already on Twilio for WhatsApp, switching builders is low-friction: design the flow in FlowBot, paste your Account SID and token into the activation panel, and point the Twilio webhook at your bot. Executions aren't metered — the builder is free — and the flow itself stays yours: <a href="/export-whatsapp-bot-code">export it as Node.js</a> and run it on your own server whenever you like.</p>

${TRADEOFF}
<p>Twilio Studio is the right tool when your automation spans voice calls, IVR menus and SMS alongside WhatsApp — that ecosystem is unmatched. For a free, WhatsApp-first flow builder on top of the same Twilio account, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Can FlowBot replace Twilio Studio for WhatsApp bots?", a: "Yes — FlowBot connects to your Twilio account (Account SID, auth token, WhatsApp number) and handles the conversation logic with 40+ WhatsApp-specific blocks. You keep Twilio's delivery and drop Studio's per-execution metering." },
    { q: "Do I still pay Twilio if I use FlowBot?", a: "You pay Twilio's per-message WhatsApp rates as usual — FlowBot adds no platform fee and no execution pricing on top. The builder, simulator, inbox and code export are free." },
    { q: "What does Twilio Studio do that FlowBot doesn't?", a: "Voice, IVR and SMS flows, plus deep hooks into Twilio Functions and TaskRouter. If your bot is part of a bigger telephony setup, Studio earns its place; if it's a WhatsApp bot, FlowBot does it free." },
  ],
};

const WA_BUSINESS_APP = {
  path: "/whatsapp-business-app-vs-bot",
  crumb: "WhatsApp Business App vs a real bot",
  priority: "0.8",
  changefreq: "monthly",
  title: "WhatsApp Business App Auto-Reply vs a Real Bot — Free Upgrade",
  desc: "Meta's free WhatsApp Business App only does greeting and away messages. See what a real bot adds — menus, FAQs, bookings, order status — and how to build one free with FlowBot.",
  h1: "WhatsApp Business App auto-replies vs a real bot",
  body: `
<p class="lead">Meta's free <strong>WhatsApp Business App</strong> is where most small businesses start — and its greeting message, away message and quick replies are genuinely useful. But they're not a bot: there are no menus, no branching, no FAQs, no data collection. When customers start asking the same five questions every day, that's the moment to upgrade — and with <a href="/">FlowBot</a> the upgrade is free too.</p>

${table("WhatsApp Business App", [
  ["Greeting & away messages", "Yes — plus full conversational flows", "Yes"],
  ["Interactive menus (1/2/3 options)", "Yes", "No"],
  ["FAQ auto-answers by keyword", "Yes", "No — quick replies are sent manually"],
  ["Collect orders / bookings / leads", "Yes — saved to variables, sent to your API", "No"],
  ["Order status & tracking replies", "Yes", "No"],
  ["Price", "Free builder + Meta Cloud API free tier", "Free"],
  ["Best at", "Automating repeat conversations", "One person replying by hand"],
])}
${DISCLAIMER}

<h2>What changes with a real bot</h2>
<p>A bot answers instantly, 24/7: a welcome message leads to a menu ("1 — Order · 2 — Track · 3 — Talk to a human"), FAQs answer themselves by keyword, bookings and phone numbers get collected and saved, and a <em>human handoff</em> block hands the chat to you when it matters — FlowBot's live inbox even lets you take over mid-conversation. You build all of it by <a href="/chatbot-flow-builder">drawing a flowchart</a>, no code.</p>

<h2>Moving up without losing your number</h2>
<p>The path most businesses take: register the same business on <strong>Meta's WhatsApp Cloud API</strong> (free to set up, free tier for service conversations), build the flow in FlowBot, and connect it in the activation panel — the <a href="/how-to-make-a-whatsapp-bot">step-by-step guide</a> covers it. Prefer not to touch Meta's console? Green API and Whapi.cloud pair with a QR scan in minutes.</p>

${TRADEOFF}
${CTA_NOTE}`,
  faqs: [
    { q: "Can the WhatsApp Business App do a chatbot?", a: "Not really — it offers one greeting message, one away message and manual quick replies. It can't show menus, branch on answers, auto-answer FAQs or collect structured info. For that you need the WhatsApp Business API plus a bot builder like FlowBot." },
    { q: "Do I lose my WhatsApp number when I move to the API?", a: "No — you can migrate your existing WhatsApp Business number to the Cloud API, or start with a fresh test number first and switch when ready. Meta's process keeps your display name and verification." },
    { q: "Is upgrading to a bot expensive?", a: "It can be free: FlowBot's builder costs nothing and Meta's Cloud API has a free tier for user-initiated service conversations. You only start paying provider fees at real volume — or if you send business-initiated template broadcasts." },
  ],
};

const CHATFUEL = {
  path: "/chatfuel-alternative",
  crumb: "Chatfuel alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Chatfuel Alternative — Free WhatsApp Bot Builder with Code Export",
  desc: "A Chatfuel alternative for WhatsApp: FlowBot builds bots free with a flowchart canvas, runs on your own provider, and exports full source code — no subscription.",
  h1: "A free Chatfuel alternative for WhatsApp",
  body: `
<p class="lead">Chatfuel is one of the longest-running bot platforms, born on Facebook Messenger and now selling WhatsApp automation on paid plans. If WhatsApp is the channel you care about, <a href="/">FlowBot</a> covers it for free — and unlike Chatfuel, your flow can leave the platform as source code.</p>

${table("Chatfuel", [
  ["Price for WhatsApp bots", "Free", "Paid plans (trial available)"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "Built-in channel"],
  ["Roots / focus", "WhatsApp-first + website widget", "Messenger & Instagram heritage, AI add-ons"],
  ["Try without signup", "Yes — guest mode", "Account required"],
  ["Best at", "Free ownable WhatsApp bots", "Social-channel automation with AI upsells"],
])}
${DISCLAIMER}

<h2>Why people switch</h2>
<p>The common story: a business grabs Chatfuel for Messenger, later needs WhatsApp, and finds it priced as a premium add-on with the bot locked in Chatfuel's cloud. FlowBot flips both parts — WhatsApp is the core product and it's free, with <a href="/export-whatsapp-bot-code">full code export</a> so trying it costs nothing and leaving costs nothing either.</p>

${TRADEOFF}
<p>Chatfuel remains a solid pick if Messenger and Instagram automation with built-in AI is your main play. For a free, ownable WhatsApp bot, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot free where Chatfuel is paid?", a: "For WhatsApp, yes — FlowBot's builder, simulator, templates, inbox and code export are free; you pay only your provider's message rates. Chatfuel's WhatsApp automation sits on paid plans." },
    { q: "Does FlowBot support Messenger or Instagram like Chatfuel?", a: "No — FlowBot is WhatsApp-first, with a website chat widget as the second surface. If Messenger/Instagram automation is central for you, Chatfuel or ManyChat fits better." },
    { q: "Can I rebuild my Chatfuel flow in FlowBot?", a: "Usually in an afternoon — the block model (messages, menus, conditions, collect answers) maps over directly, and you can describe the flow to FlowBot's AI Builder to get a first draft on the canvas." },
  ],
};

const TIDIO = {
  path: "/tidio-alternative",
  crumb: "Tidio alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Tidio Alternative — Free Chatbot Flow Builder, WhatsApp-First",
  desc: "A Tidio alternative without per-conversation pricing: FlowBot builds chatbot flows free for WhatsApp and your website widget, with full code export and no lock-in.",
  h1: "A free Tidio alternative",
  body: `
<p class="lead">Tidio is a popular website live-chat suite with chatbots (and the Lyro AI agent) attached — great for e-commerce helpdesks, priced per seats and conversations. <a href="/">FlowBot</a> comes from the other direction: a free <a href="/chatbot-flow-builder">flow builder</a> that's WhatsApp-first, with a website widget included and the code always exportable.</p>

${table("Tidio", [
  ["Price to build & run bots", "Free", "Free tier, then per-seat / per-conversation plans"],
  ["WhatsApp as a first-class channel", "Yes — four providers supported", "Available, but website chat is the core"],
  ["Website chat widget", "Yes — one script tag", "Yes — core product"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["AI", "Optional, bring your own LLM key", "Lyro AI on paid usage"],
  ["Best at", "Free ownable WhatsApp + web bots", "Live-chat helpdesk with agents"],
])}
${DISCLAIMER}

<h2>Helpdesk suite vs bot you own</h2>
<p>Tidio's value is the managed helpdesk around the bot — agent seats, ticketing, Shopify apps. If what you actually need is the <em>bot</em>: FlowBot builds it free, runs it on WhatsApp and your site simultaneously, shows a live inbox where you can take over any conversation, and never meters your chats. When AI answers matter, add an AI block with your own API key — no per-resolution pricing.</p>

${TRADEOFF}
<p>If you run a support team living in live chat all day, Tidio's agent tooling is worth paying for. For a free bot you own on WhatsApp and web, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Does FlowBot have a website widget like Tidio?", a: "Yes — every bot can be embedded on your site with one script tag, and the same flow also runs on WhatsApp. Conversations from both show up in the free live inbox." },
    { q: "Is FlowBot's AI priced like Tidio's Lyro?", a: "No metering — FlowBot's AI Reply block uses your own LLM API key (Anthropic, OpenAI or Gemini), so you pay your model provider directly at cost, not per resolved conversation." },
    { q: "When is Tidio the better choice?", a: "When the live-chat helpdesk is the product you need: multiple agent seats, ticketing, deep Shopify integration. FlowBot's inbox covers an owner-operator, not a support department." },
  ],
};

const BOTPRESS = {
  path: "/botpress-alternative",
  crumb: "Botpress alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Botpress Alternative — Simpler Free WhatsApp Bot Builder",
  desc: "A simpler Botpress alternative for WhatsApp: FlowBot is a free deterministic flow builder — no AI-token billing, no studio learning curve, full code export.",
  h1: "A simpler, free Botpress alternative",
  body: `
<p class="lead">Botpress is a developer-grade platform for LLM-powered agents — genuinely powerful, with a studio, knowledge bases and AI-token-based billing. But if what you need is a reliable WhatsApp bot with menus, FAQs and bookings, that power turns into overhead. <a href="/">FlowBot</a> keeps it deterministic, visual and free.</p>

${table("Botpress", [
  ["Learning curve", "Minutes — drag, wire, test", "Hours — studio, nodes, knowledge bases"],
  ["Runtime model", "Deterministic flowchart (AI only if you add it)", "LLM-agent centric"],
  ["Billing", "Free — provider message costs only", "Free tier, then usage/AI-token based"],
  ["Own / export the code", "Yes — Node.js ZIP", "Partially (open-source roots, cloud features differ)"],
  ["WhatsApp setup", "Four providers, guided activation", "Via channel integrations"],
  ["Best at", "Free predictable WhatsApp bots", "Complex AI agents, developer extensibility"],
])}
${DISCLAIMER}

<h2>Deterministic first, AI when you choose</h2>
<p>FlowBot's engine runs exactly the flowchart you drew — a menu is a menu, a booking is a booking, and nothing improvises in front of customers. When you do want an AI moment (a support Q&amp;A block, say), you drop in an AI Reply block with <em>your own</em> LLM key, scoped to that block. No token packages, no agent unpredictability, and the whole bot still <a href="/export-whatsapp-bot-code">exports as plain Node.js</a>.</p>

${TRADEOFF}
<p>Botpress is the right call for teams building sophisticated AI agents with custom code, integrations and knowledge retrieval. For a free WhatsApp bot that behaves the same every time, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "How is FlowBot different from Botpress?", a: "Botpress centres on LLM agents and developer tooling with usage-based billing; FlowBot centres on a free deterministic flowchart where AI is an optional block using your own key. Simpler to learn, predictable in production, and the code exports." },
    { q: "Can FlowBot do AI answers like Botpress?", a: "Yes, scoped: the AI Reply block (or an AI step inside a custom block) chats with your own Anthropic/OpenAI/Gemini key until the customer returns to the flow. The rest of the bot stays deterministic." },
    { q: "Who should pick Botpress instead?", a: "Developer teams building complex agents — RAG over documents, custom actions in code, multi-step reasoning. That's Botpress's home turf; FlowBot deliberately stays simpler." },
  ],
};

const RESPOND_IO = {
  path: "/respond-io-alternative",
  crumb: "Respond.io alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Respond.io Alternative — Free WhatsApp Bot Builder, No Seats",
  desc: "A Respond.io alternative when you need the bot, not the seats: FlowBot builds WhatsApp bots free with a visual canvas, live inbox takeover and full code export.",
  h1: "A free Respond.io alternative for the bot part",
  body: `
<p class="lead">Respond.io is an omnichannel inbox for support teams — WhatsApp, Instagram, Telegram and more flowing into seat-priced agent workspaces, with automation attached. If your actual need is the <em>automation</em> — a WhatsApp bot that answers, routes and collects — <a href="/">FlowBot</a> does that part free.</p>

${table("Respond.io", [
  ["Model", "Free bot builder", "Seat-priced omnichannel team inbox"],
  ["Price", "Free — provider costs only", "Per-seat monthly plans"],
  ["Bot / automation builder", "Core product — 40+ blocks", "Workflows attached to the inbox"],
  ["Channels", "WhatsApp + website widget", "WhatsApp, IG, Telegram, Messenger, email…"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Best at", "Free ownable bots", "Multi-agent, multi-channel support ops"],
])}
${DISCLAIMER}

<h2>Bot-first vs inbox-first</h2>
<p>Respond.io starts from the team inbox and adds automation; FlowBot starts from the bot and adds a lightweight inbox — you watch conversations live, take over from the bot when a customer needs a human, and see a <a href="/chatbot-flow-builder">funnel overlay</a> of where people drop off. For a solo founder or small shop, that's the whole job, with no seats to pay for.</p>

${TRADEOFF}
<p>If you're running a support operation with several agents across many channels, Respond.io's inbox is what you're actually buying — and it's good at it. For the free bot underneath, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot a full Respond.io replacement?", a: "Only for the bot/automation part. Respond.io's multi-agent omnichannel inbox is its core product; FlowBot's free inbox covers one owner taking over conversations, not agent teams with assignment and reporting." },
    { q: "Can I use FlowBot with a team inbox later?", a: "Yes — the bot runs on your own provider (e.g. Meta Cloud API), so you can point the same number's inbox tooling wherever you like later, or export the bot's code and integrate it into any stack." },
    { q: "What does FlowBot cost compared to Respond.io?", a: "FlowBot is free — no seats, no monthly fee; you pay only WhatsApp provider message costs. Respond.io is priced per seat per month." },
  ],
};

const SLEEKFLOW = {
  path: "/sleekflow-alternative",
  crumb: "SleekFlow alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "SleekFlow Alternative — Free WhatsApp Bot Builder (FlowBot)",
  desc: "A SleekFlow alternative for the bot itself: FlowBot builds WhatsApp flows free on your own provider, with live inbox takeover and full code export — no subscription.",
  h1: "A free SleekFlow alternative",
  body: `
<p class="lead">SleekFlow is a social-commerce suite — omnichannel inbox, broadcast campaigns, payment links in chat — sold as a subscription, strong in Southeast Asia. If you mainly need the WhatsApp bot rather than the suite, <a href="/">FlowBot</a> builds it free and lets you keep the code.</p>

${table("SleekFlow", [
  ["Price to build bots", "Free", "Free tier, then monthly plans"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "Managed channels"],
  ["Payment links in chat", "Yes — payment link block", "Yes — with checkout tooling"],
  ["Broadcasts", "Simple broadcasts included", "Segmented campaigns — core strength"],
  ["Best at", "Free ownable bots", "Social commerce + team collaboration"],
])}
${DISCLAIMER}

<h2>The suite vs the bot</h2>
<p>SleekFlow earns its subscription when you use the whole suite — team inbox, segmented campaigns, in-chat checkout. FlowBot covers the conversational core for free: menus, catalogs, <a href="/whatsapp-bot-for-ecommerce">order flows</a>, payment links, human takeover from a live inbox, and simple broadcasts to everyone who has messaged your bot. And the flow is yours — <a href="/export-whatsapp-bot-code">export it</a> any time.</p>

${TRADEOFF}
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot free where SleekFlow is paid?", a: "Yes — FlowBot's builder, simulator, widget, inbox, funnel analytics and code export are free; you pay only your WhatsApp provider's rates. SleekFlow's meaningful features sit on monthly plans." },
    { q: "Can FlowBot send payment links like SleekFlow?", a: "Yes — the Payment Link block drops your payment URL (Stripe, Razorpay, anything) into the flow with the amount and context filled from variables. Full in-chat checkout with cart management is SleekFlow territory." },
    { q: "Does FlowBot do broadcast campaigns?", a: "Simple ones — one message to everyone who has chatted with your bot on your provider, with delivery counts. Segmented, scheduled campaign tooling is where SleekFlow and BSPs specialise." },
  ],
};

const ZOKO = {
  path: "/zoko-alternative",
  crumb: "Zoko alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "Zoko Alternative — Free WhatsApp Bot for Stores (FlowBot)",
  desc: "A Zoko alternative without usage-based pricing: FlowBot builds WhatsApp store bots free — catalog, order status, payment links — on your own provider, code included.",
  h1: "A free Zoko alternative for store bots",
  body: `
<p class="lead">Zoko is built for Shopify-on-WhatsApp — catalog sync, in-chat checkout, upsells — billed on plans plus usage. If your store needs a capable WhatsApp bot more than a full commerce sync, <a href="/">FlowBot</a> handles the conversations free.</p>

${table("Zoko", [
  ["Price", "Free — provider costs only", "Monthly plans + usage"],
  ["Shopify catalog sync & checkout", "No — catalog blocks are manual", "Yes — core strength"],
  ["Store conversation flows", "Yes — catalog, search, order status, tracking", "Yes"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Provider choice", "Meta, Twilio, Green API, Whapi", "Managed BSP channel"],
  ["Best at", "Free ownable store bots", "Deep Shopify commerce on WhatsApp"],
])}
${DISCLAIMER}

<h2>What a store gets for free</h2>
<p>FlowBot's e-commerce blocks cover the conversations that actually recur: a browsable <em>mini catalog</em>, <em>product search</em> by keyword, <em>order status</em> and <em>tracking link</em> lookups (wire an HTTP block to your store's API for live data), <em>payment links</em>, cart-recovery nudges and CSAT ratings. The <a href="/whatsapp-bot-for-ecommerce">e-commerce guide</a> shows a full build. What FlowBot won't do is sync your Shopify catalog automatically or run checkout inside WhatsApp — that's Zoko's speciality and worth paying for if in-chat checkout is your funnel.</p>

${TRADEOFF}
${CTA_NOTE}`,
  faqs: [
    { q: "Does FlowBot integrate with Shopify like Zoko?", a: "Not natively — catalog blocks are configured by hand, and live order data comes from wiring an HTTP Request block to your store's API. Zoko's automatic Shopify sync and in-chat checkout are its real differentiators." },
    { q: "Can FlowBot answer order-status questions?", a: "Yes — the Order Status and Tracking Link blocks collect the order ID and reply with status or tracking URL, either from a template or live from your API via an HTTP block." },
    { q: "Why pick FlowBot over Zoko?", a: "Cost and ownership: the builder is free with no usage billing, and the whole bot exports as Node.js code. Pick Zoko when in-chat Shopify checkout drives enough revenue to justify its plans." },
  ],
};

const DOUBLETICK = {
  path: "/doubletick-alternative",
  crumb: "DoubleTick alternative",
  priority: "0.7",
  changefreq: "monthly",
  title: "DoubleTick Alternative — Free WhatsApp Bot Builder (FlowBot)",
  desc: "A DoubleTick alternative for the automation side: FlowBot builds WhatsApp bots free — flows, FAQs, lead capture, simple broadcasts — with full code export and no per-user pricing.",
  h1: "A free DoubleTick alternative",
  body: `
<p class="lead">DoubleTick is a sales-team WhatsApp tool from India — bulk broadcasts, a mobile-first shared inbox and per-user pricing. If what you're after is the <em>bot</em> — automated answers, lead capture, routing — <a href="/">FlowBot</a> gives you that for free.</p>

${table("DoubleTick", [
  ["Price", "Free — provider costs only", "Per-user monthly plans"],
  ["Bot / flow builder", "Core product — visual canvas, 40+ blocks", "Chatbot features on higher tiers"],
  ["Broadcasts", "Simple broadcasts included", "Bulk campaigns — core strength"],
  ["Lead capture", "Yes — collect blocks + API forwarding", "Yes — CRM-style"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Best at", "Free ownable bots", "Sales teams broadcasting at volume"],
])}
${DISCLAIMER}

<h2>Sales tool vs bot builder</h2>
<p>DoubleTick optimises for a sales team blasting catalogs and following up from phones. FlowBot optimises for the conversation itself: a <a href="/chatbot-flow-builder">flowchart</a> that qualifies leads (Lead Qualification block), collects phone numbers and requirements, answers FAQs around the clock, and hands hot leads to you — with takeover from the live inbox when you want to close personally.</p>

${TRADEOFF}
<p>If your team's day is bulk campaigns and pipeline follow-ups on mobile, DoubleTick is built for that. For the free bot doing the automated talking, use FlowBot.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot free compared to DoubleTick?", a: "Yes — no per-user pricing; the builder, inbox, funnel analytics and code export are free, and you pay only your WhatsApp provider's message costs." },
    { q: "Can FlowBot capture leads like DoubleTick?", a: "Yes — Lead Qualification, Collect Phone/Email and custom blocks save answers to variables, and an HTTP Request block can push each lead straight into your CRM or a Google Sheet endpoint." },
    { q: "Does FlowBot do bulk WhatsApp marketing?", a: "It does simple broadcasts to people who've already chatted with your bot. High-volume cold campaigns with templates and segmentation are DoubleTick/BSP territory — mind WhatsApp's template rules either way." },
  ],
};

const YELLOW_AI = {
  path: "/yellow-ai-alternative",
  crumb: "Yellow.ai alternative",
  priority: "0.6",
  changefreq: "monthly",
  title: "Yellow.ai Alternative for Small Business — Free WhatsApp Bots",
  desc: "Yellow.ai is enterprise conversational AI with custom pricing. For a small business WhatsApp bot, FlowBot does the job free — visual flows, AI where you choose, code export.",
  h1: "A small-business alternative to Yellow.ai",
  body: `
<p class="lead">Yellow.ai sells enterprise conversational AI — voice + chat agents across dozens of channels, enterprise integrations, custom pricing and onboarding. Genuinely the right shape for a bank or airline. For a shop, clinic, restaurant or D2C brand that needs a WhatsApp bot this quarter, <a href="/">FlowBot</a> is the version that ships today, free.</p>

${table("Yellow.ai", [
  ["Pricing", "Free", "Enterprise — custom quotes"],
  ["Time to first live bot", "An afternoon", "Sales process + implementation"],
  ["Runtime", "Deterministic flows, AI blocks optional (your key)", "LLM-agent platform"],
  ["Channels", "WhatsApp + website widget", "40+ channels incl. voice"],
  ["Own / export the code", "Yes — Node.js ZIP", "No"],
  ["Best at", "SMB WhatsApp bots, fast and free", "Enterprise-scale automation programs"],
])}
${DISCLAIMER}

<h2>Enterprise platform vs shipping this week</h2>
<p>Most small businesses evaluating Yellow.ai actually need five things: answer FAQs, take bookings or orders, capture leads, hand off to a human, and show up on WhatsApp. That's a <a href="/chatbot-flow-builder">flowchart</a>, not an enterprise program — FlowBot builds it visually, simulates it instantly, launches it on your own Meta/Twilio/Green/Whapi account and shows a funnel of where customers drop off. AI answers? Add the block with your own LLM key, scoped to where you want it.</p>

${TRADEOFF}
<p>If you're an enterprise with voice bots, agent-assist and multi-market rollouts, Yellow.ai's platform and services are the point. For everyone smaller, FlowBot gets the same WhatsApp job done free.</p>
${CTA_NOTE}`,
  faqs: [
    { q: "Is FlowBot comparable to Yellow.ai?", a: "For the small-business WhatsApp use case, yes — flows, FAQs, bookings, lead capture, human handoff and optional AI cover it. For enterprise voice bots, agent-assist suites and 40-channel rollouts, Yellow.ai plays a different league." },
    { q: "Does FlowBot use AI like Yellow.ai?", a: "Optionally and under your control — AI Reply blocks run on your own Anthropic/OpenAI/Gemini key exactly where you place them; the rest of the flow is deterministic. No platform AI pricing." },
    { q: "What does FlowBot cost?", a: "Nothing for the builder, simulator, widget, inbox, analytics and code export. You pay only your WhatsApp provider's message costs — Meta's Cloud API includes a free tier for service conversations." },
  ],
};

/* ------------------- third-party "X vs Y" comparisons -------------------
   Search Console shows queries like "wati vs aisensy" and "wati vs gallabox"
   surfacing our alternative pages. These pages answer that exact question
   honestly — a verdict for both sides — then present FlowBot as the free,
   ownable third option. Facts mirror the alternative pages above. */

const BRANDS = {
  wati: {
    name: "Wati",
    alt: "/wati-alternative",
    rows: {
      pricing: "Paid monthly plans; automation on higher tiers",
      meta: "Adds a markup on Meta's conversation rates",
      builder: "Visual flow builder on paid tiers",
      inbox: "Mature shared team inbox with roles",
    },
    strength: "a mature team inbox and deep CRM integrations (Zoho, HubSpot, Salesforce)",
    chooseIf: "your support team lives in a shared inbox and your CRM must stay in sync",
  },
  aisensy: {
    name: "AiSensy",
    alt: "/aisensy-alternative",
    rows: {
      pricing: "Free tier; paid plans for advanced features",
      meta: "No markup — Meta's rates passed through",
      builder: "Chatbot flows included; campaign-first product",
      inbox: "Team inbox on paid plans",
    },
    strength: "broadcast campaigns and marketing automation at Indian-market pricing",
    chooseIf: "WhatsApp is primarily a marketing channel for you — campaigns, broadcasts, click-to-WhatsApp ads",
  },
  interakt: {
    name: "Interakt",
    alt: "/interakt-alternative",
    rows: {
      pricing: "Quarterly plans",
      meta: "Standard BSP conversation billing",
      builder: "Automation workflows included",
      inbox: "Shared team inbox",
    },
    strength: "D2C e-commerce tooling and unified WhatsApp + Instagram handling",
    chooseIf: "you run a D2C store and want WhatsApp and Instagram handled in one dashboard",
  },
  gallabox: {
    name: "Gallabox",
    alt: "/gallabox-alternative",
    rows: {
      pricing: "Paid plans",
      meta: "Standard BSP conversation billing",
      builder: "No-code bot builder included",
      inbox: "Shared team inbox with sales workflows",
    },
    strength: "a no-code builder paired with a sales-focused team inbox and lead workflows",
    chooseIf: "a sales team qualifies WhatsApp leads together and wants no-code workflows around that",
  },
};

const vsTable = (a, b) => `<div class="tablewrap"><table>
<tr><th></th><th>${a.name}</th><th>${b.name}</th></tr>
<tr><td>Pricing model</td><td>${a.rows.pricing}</td><td>${b.rows.pricing}</td></tr>
<tr><td>Meta message rates</td><td>${a.rows.meta}</td><td>${b.rows.meta}</td></tr>
<tr><td>Bot building</td><td>${a.rows.builder}</td><td>${b.rows.builder}</td></tr>
<tr><td>Team inbox</td><td>${a.rows.inbox}</td><td>${b.rows.inbox}</td></tr>
<tr><td>Own your bot's code</td><td>No — managed cloud</td><td>No — managed cloud</td></tr>
</table></div>`;

const vsPage = (aKey, bKey, x) => {
  const a = BRANDS[aKey], b = BRANDS[bKey];
  return {
    path: `/${aKey}-vs-${bKey}`,
    crumb: `${a.name} vs ${b.name}`,
    priority: "0.7",
    changefreq: "monthly",
    title: `${a.name} vs ${b.name} (2026): Honest Comparison + Free Alternative`,
    desc: `${a.name} vs ${b.name} for WhatsApp business messaging — pricing, bot builders, team inboxes and who each one fits. Plus the free third option: FlowBot, where you own the bot and its code.`,
    h1: `${a.name} vs ${b.name}: which one — and do you need either?`,
    body: `
<p class="lead">${x.lead}</p>

${vsTable(a, b)}
${DISCLAIMER}

<h2>Choose ${a.name} if…</h2>
<p>…${a.chooseIf}. ${a.name}'s edge is ${a.strength}.</p>

<h2>Choose ${b.name} if…</h2>
<p>…${b.chooseIf}. ${b.name}'s edge is ${b.strength}.</p>

<h2>The third option: build the bot free and own it</h2>
<p>If what you actually need from ${a.name} or ${b.name} is <em>the WhatsApp bot itself</em> — menus, FAQs, bookings, orders, lead capture — you may not need a subscription at all. <a href="/">FlowBot</a> builds the bot as a drag-and-drop flowchart, free: test it in a live simulator, launch it on your own provider account (Meta Cloud API, Twilio, Green API or Whapi.cloud) and <a href="/export-whatsapp-bot-code">export the complete Node.js code</a> whenever you like. A live inbox with human takeover, funnel analytics and a website chat widget are included. What it isn't: a managed BSP with a multi-agent campaign suite — that's exactly the part ${a.name} and ${b.name} charge for.</p>
<p>Full comparisons: <a href="${a.alt}">FlowBot vs ${a.name}</a> · <a href="${b.alt}">FlowBot vs ${b.name}</a> · <a href="/whatsapp-bot-comparisons">all 16 platforms</a>.</p>
${CTA_NOTE}`,
    faqs: [
      {
        q: `Which is better, ${a.name} or ${b.name}?`,
        a: `Neither is universally better. ${a.name} fits when ${a.chooseIf}. ${b.name} fits when ${b.chooseIf}. If you only need the bot itself, consider whether you need either — FlowBot builds and runs one free on your own Meta, Twilio, Green API or Whapi account.`,
      },
      {
        q: `Is there a free alternative to ${a.name} and ${b.name}?`,
        a: `Yes — FlowBot. The visual builder, templates, live simulator, website widget, inbox with human takeover and full Node.js code export are free; you pay only your WhatsApp provider's message costs. Unlike a managed BSP, you can export the bot and leave any time.`,
      },
      x.faq,
    ],
  };
};

const VS_PAGES = [
  vsPage("wati", "aisensy", {
    lead: `Wati and AiSensy are the two names Indian businesses shortlist first for WhatsApp. The honest split: AiSensy is the value pick for campaign-led marketing — there's a free tier and Meta's conversation rates are passed through without markup — while Wati is the more support-oriented platform, with a mature team inbox and CRM integrations that its higher pricing pays for.`,
    faq: {
      q: "Do Wati and AiSensy charge a markup on Meta's message rates?",
      a: "Wati's plans add a markup on Meta's conversation rates; AiSensy passes Meta's rates through and charges for the platform instead. Either way you're paying for the managed platform — with a bring-your-own-provider builder like FlowBot, you pay Meta (or Twilio, Green API, Whapi) directly and nothing on top.",
    },
  }),
  vsPage("wati", "interakt", {
    lead: `Wati and Interakt solve overlapping but different problems. Wati leans into customer support — shared team inbox, roles, CRM integrations — on monthly plans. Interakt, backed by Jio Haptik, leans into D2C commerce with unified WhatsApp + Instagram handling, billed quarterly. Which fits depends on whether your WhatsApp is a support desk or a storefront.`,
    faq: {
      q: "Does Wati handle Instagram like Interakt does?",
      a: "Unified WhatsApp + Instagram handling is Interakt's differentiator; Wati is WhatsApp-centric. If Instagram DMs are a real channel for your store, that's a point for Interakt — if not, compare them on inbox and CRM fit instead.",
    },
  }),
  vsPage("wati", "gallabox", {
    lead: `Wati and Gallabox both sell a managed WhatsApp inbox for SMB teams, so this choice is about flavour: Wati goes deeper on CRM integrations (Zoho, HubSpot, Salesforce) and support workflows, while Gallabox pairs a friendlier no-code builder with sales-focused lead workflows. Both are subscriptions; neither lets you take the bot with you.`,
    faq: {
      q: "Which is easier for a non-technical team, Wati or Gallabox?",
      a: "Gallabox generally gets the nod for no-code friendliness; Wati's flow builder sits on its higher tiers. If ease-of-building is the whole question, also try FlowBot's free drag-and-drop canvas — there's no signup, so you can judge in ten minutes.",
    },
  }),
  vsPage("aisensy", "interakt", {
    lead: `AiSensy and Interakt are both Indian-market favourites with sharp pricing, so the real question is what your WhatsApp is for. AiSensy is campaign-first — broadcasts, click-to-WhatsApp ads, marketing automation, with a free tier to start. Interakt is store-first — D2C tooling and unified WhatsApp + Instagram, on quarterly plans.`,
    faq: {
      q: "How do AiSensy and Interakt differ on billing?",
      a: "AiSensy has a free tier and monthly paid plans with Meta's rates passed through; Interakt bills on quarterly plans. If you want to start without committing, AiSensy's free tier — or a genuinely free builder like FlowBot — is the lower-friction door.",
    },
  }),
  vsPage("aisensy", "gallabox", {
    lead: `AiSensy and Gallabox overlap less than their listings suggest. AiSensy is a marketing engine — campaigns, broadcasts and ads at value pricing with a free tier. Gallabox is a sales workspace — a no-code builder feeding a shared team inbox with lead workflows. Marketing-led teams lean AiSensy; sales-led teams lean Gallabox.`,
    faq: {
      q: "Which is better for lead generation, AiSensy or Gallabox?",
      a: "For generating leads (click-to-WhatsApp ads, broadcasts), AiSensy's marketing tooling fits. For qualifying and closing leads as a team, Gallabox's sales inbox fits. The bot that captures and routes those leads is something you can also build free — FlowBot's Collect blocks save answers as variables and hand off to a human when needed.",
    },
  }),
  vsPage("interakt", "gallabox", {
    lead: `Interakt and Gallabox both court Indian SMBs, from different angles. Interakt is commerce infrastructure — D2C catalog tooling and unified WhatsApp + Instagram, quarterly billing. Gallabox is a team workspace — no-code bot builder plus a sales inbox with lead workflows. Pick by which mirrors your day: running a store, or running a pipeline.`,
    faq: {
      q: "I run a Shopify/D2C store — Interakt or Gallabox?",
      a: "Interakt's D2C tooling and Instagram coverage make it the more store-shaped choice; Gallabox counters with sales workflows if your revenue comes from conversations rather than catalog traffic. For the storefront bot itself — catalog, order status, payment links — FlowBot's free e-commerce template covers it and exports the code.",
    },
  }),
];

// Promo band right under the h1 — the "hero" of every comparison page —
// plus an exit-intent CTA (renderPage shows it when the cursor heads for
// the back button; no history manipulation, so no abusive-experience risk).
const PROMO = `<div class="promoband">
  <div><strong>⚡ Skip the subscription — build your WhatsApp bot free while you compare.</strong><br>Drag &amp; drop builder, live simulator, your own provider — and you keep the full code.</div>
  <a class="cta" href="/app">Open the free builder</a>
</div>`;

const pages = [HUB, WATI, AISENSY, INTERAKT, MANYCHAT, LANDBOT, GALLABOX, TWILIO_STUDIO, WA_BUSINESS_APP, CHATFUEL, TIDIO, BOTPRESS, RESPOND_IO, SLEEKFLOW, ZOKO, DOUBLETICK, YELLOW_AI, ...VS_PAGES]
  .map((p) => ({ ...p, body: PROMO + p.body, exitIntent: true }));

// sitemap/llms entries (same shape docs.entries uses)
const entries = pages.map((p) => ({ path: p.path, title: p.title, desc: p.desc, priority: p.priority, changefreq: p.changefreq }));

module.exports = { pages, entries };
