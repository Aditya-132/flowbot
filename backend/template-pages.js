// ============================================================
// Template gallery — one indexable landing page per ready-made
// bot template. Each page describes the exact bot, then sends the
// visitor straight into the builder with that template preloaded
// (/app?template=<key>). Rendered with seo.renderPage so the
// chrome / JSON-LD / FAQ stay consistent with the rest of the site.
//
// Facts here mirror frontend/src/templates.js (block counts, menus,
// coupon codes). Keep them in sync when a template changes — see
// [[flowbot-seo-architecture]] on keeping product claims truthful.
// ============================================================

const seo = require("./seo");
const { CANONICAL } = seo;

// One-click "load this exact bot" band, prepended to every page body.
const promo = (key) => `<div class="promoband">
  <div><strong>⚡ Load this exact bot in one click — free.</strong><br>Opens on the canvas with every block wired up. Swap in your own details, test it in the live simulator, then launch on WhatsApp or your website.</div>
  <a class="cta" href="/app?template=${key}">Open this template</a>
</div>`;

// A styled "what the conversation looks like" menu map. options is the
// list of top-level menu choices the bot offers.
const flowMap = (intro, options) => `<div class="card" style="background:#0b2818;color:#eafff2">
  <p style="margin:0 0 10px;color:#bcd9c6;font-size:14px">💬 ${intro}</p>
  <ol style="margin:0;padding-left:20px">${options.map((o) => `<li style="margin:4px 0">${o}</li>`).join("")}</ol>
</div>`;

const CROSS = `<p>Not quite the bot you need? <a href="/whatsapp-bot-templates">Browse all templates</a>, describe your business to the AI Builder, or follow the <a href="/how-to-make-a-whatsapp-bot">step-by-step guide</a> to build one from scratch.</p>`;

/* ------------------------------ template pages ------------------------------ */

const RESTAURANT = {
  key: "restaurant",
  path: "/whatsapp-bot-templates/spice-villa-restaurant",
  crumb: "Restaurant bot template",
  priority: "0.7",
  changefreq: "monthly",
  title: "Restaurant WhatsApp Bot Template — Free Ordering & Booking Demo",
  desc: "Load Spice Villa, a free 20-block WhatsApp bot template for restaurants: table booking, food orders with a menu and payment link, offers, location and staff handoff. Try it live and make it yours.",
  h1: "Spice Villa — a free restaurant WhatsApp bot template",
  body: `
<article class="doc">
<p class="lead"><strong>Spice Villa</strong> is a complete, working restaurant bot you can load into the <a href="/app">FlowBot builder</a> in one click. It's 20 blocks wired end to end — table bookings, food orders, menu, offers, location and a handoff to your staff — all free to edit, simulate, launch or <a href="/export-whatsapp-bot-code">export as code</a>.</p>

${flowMap("Spice Villa greets the diner, checks business hours, then offers:", [
  "🪑 <strong>Book a table</strong> — collects name, phone and party size, then an appointment date/time and confirms the reservation.",
  "🛵 <strong>Order food</strong> — shows a dish catalog with prices, takes the order and delivery address, and sends a payment link.",
  "📜 <strong>Menu &amp; offers</strong> — the full menu card plus a weekday coupon (TASTY10).",
  "📍 <strong>Location &amp; timings</strong> — address, hours and a Google Maps link.",
  "🙋 <strong>Talk to our staff</strong> — hands the chat over to a human.",
])}

<h2>What you get out of the box</h2>
<div class="grid">
  <div class="card"><h3>🪑 Reservations</h3><p>Appointment + booking-confirm blocks capture the date, time and guest count and reply with a confirmation.</p></div>
  <div class="card"><h3>🛒 Orders with payment</h3><p>A mini catalog, order collection, address capture and a payment-link block — the whole order flow, no code.</p></div>
  <div class="card"><h3>⏰ Business hours</h3><p>Answers differently when you're closed, so late-night visitors still book or browse.</p></div>
  <div class="card"><h3>⭐ Feedback</h3><p>A CSAT block asks for a 1–5 rating before goodbye and saves the score.</p></div>
</div>

<h2>Make it yours in minutes</h2>
<p>Open the template, replace the dishes, prices and coupon with your own, and test the whole conversation in the simulator. When it reads right, connect your WhatsApp number (Meta Cloud API, Twilio, Green API or Whapi.cloud) or drop it on your site as a chat widget. See the <a href="/whatsapp-bot-for-restaurants">restaurant bot guide</a> for the full walkthrough.</p>
${CROSS}
</article>`,
  faqs: [
    { q: "Is the restaurant bot template free?", a: "Yes — loading Spice Villa, editing it, testing it in the simulator, launching it on your WhatsApp number and exporting the source code are all free. You only pay your WhatsApp provider's message costs." },
    { q: "Can customers order and pay through the bot?", a: "Yes. The template shows a dish catalog, collects the order and delivery address, and sends a Payment Link (UPI, Razorpay, Stripe or any URL). You can also point the HTTP Request block at your own kitchen/order system." },
    { q: "Does it handle table reservations?", a: "Yes — the Appointment and Booking Confirm blocks collect the date, time and party size and reply with a confirmation, in the same flow as ordering and FAQs." },
  ],
};

const HOTEL = {
  key: "hotel",
  path: "/whatsapp-bot-templates/hotel-paradise-concierge",
  crumb: "Hotel bot template",
  priority: "0.7",
  changefreq: "monthly",
  title: "Hotel WhatsApp Bot Template — Free 77-Block Concierge Demo",
  desc: "Load Hotel Paradise, a free 77-block WhatsApp concierge template: room bookings, dining & room service, spa, banquets, airport transfer, booking lookup and multilingual guest FAQs. Try it live.",
  h1: "Hotel Paradise — a free 77-block hotel concierge template",
  body: `
<article class="doc">
<p class="lead"><strong>Hotel Paradise</strong> is FlowBot's most complete template: a 77-block digital concierge that greets guests in English, Hindi or Telugu and handles almost everything a front desk does — before, during and after a stay. Load it into the <a href="/app">builder</a>, rebrand it, and it's your hotel's bot.</p>

${flowMap("After a language choice, Pari the concierge offers eight services:", [
  "🛏️ <strong>Book a room</strong> — room cards with prices, then name, phone, email, dates and guest count, with an advance payment link.",
  "🍽️ <strong>Dining &amp; room service</strong> — table bookings and 24×7 in-room dining orders.",
  "💆 <strong>Spa &amp; wellness</strong> — a spa menu with therapy bookings.",
  "💒 <strong>Banquets &amp; events</strong> — qualifies weddings/corporate/parties and captures the lead.",
  "🚖 <strong>Airport transfer</strong> — books a pickup/drop with flight number and time.",
  "📂 <strong>My booking</strong> — look up, modify or cancel a reservation.",
  "ℹ️ <strong>Hotel info &amp; FAQs</strong> — location, facilities, check-in times, contact card, FAQ.",
  "🙋 <strong>Talk to reception</strong> — human handoff.",
])}

<h2>Why it's a strong starting point</h2>
<div class="grid">
  <div class="card"><h3>🌐 Multilingual</h3><p>A Language Router branches guests into English / Hindi / Telugu from the first message — control the wording in each.</p></div>
  <div class="card"><h3>🛏️ Full booking flow</h3><p>Room catalog, guest details, dates, advance payment link and a direct-booking coupon — all wired.</p></div>
  <div class="card"><h3>🛎️ Stay services</h3><p>Room service, spa, dining and airport transfers, each collecting exactly what your team needs.</p></div>
  <div class="card"><h3>🤝 Deterministic</h3><p>The bot never invents room rates or availability — it says exactly what you configured.</p></div>
</div>

<h2>Make it yours</h2>
<p>Every one of the 77 blocks is editable — swap Hotel Paradise's rooms, prices, venues and contact details for your own, delete the sections you don't need, and test the whole thing in the simulator. Full details on the <a href="/whatsapp-bot-for-hotels">hotel bot page</a>.</p>
${CROSS}
</article>`,
  faqs: [
    { q: "Is the 77-block hotel template really free?", a: "Yes — loading, editing, simulating, launching and exporting Hotel Paradise are all free. Your only cost is whatever your WhatsApp provider charges for messages." },
    { q: "Can guests book rooms in the bot?", a: "Yes. The template shows room types with prices, collects dates and guest details, sends an advance payment link and confirms the booking. The HTTP Request block can push the reservation into your PMS or a Google Sheet endpoint." },
    { q: "Does it work in more than one language?", a: "Yes — the Language Router asks the guest's language up front (English/Hindi/Telugu in the template) and routes them down separate branches you fully control." },
  ],
};

const STORE = {
  key: "store",
  path: "/whatsapp-bot-templates/trendkart-online-store",
  crumb: "Online store bot template",
  priority: "0.7",
  changefreq: "monthly",
  title: "E-commerce WhatsApp Bot Template — Free Online Store Chatbot",
  desc: "Load TrendKart, a free 19-block WhatsApp bot template for online stores: product catalog, keyword search, order tracking, returns & shipping, offers and support. Try it live and make it yours.",
  h1: "TrendKart — a free online store WhatsApp bot template",
  body: `
<article class="doc">
<p class="lead"><strong>TrendKart</strong> is a ready-to-launch e-commerce bot — 19 blocks covering the questions that flood every store's inbox: "what do you sell?", "where's my order?", "what's your return policy?". Load it in the <a href="/app">builder</a>, plug in your products, and go.</p>

${flowMap("TrendKart welcomes the shopper and offers:", [
  "🛍️ <strong>Browse bestsellers</strong> — a catalog and a deal-of-the-day product card with a buy → payment-link path.",
  "🔎 <strong>Search a product</strong> — type 'sneakers' and the bot keyword-matches your catalog.",
  "📦 <strong>Track my order</strong> — collects the order ID and returns status plus a live tracking link.",
  "↩️ <strong>Returns &amp; shipping</strong> — return-policy and shipping-info blocks answer instantly.",
  "🎉 <strong>Offers</strong> — a coupon block (TREND15).",
  "🙋 <strong>Customer support</strong> — human handoff.",
])}

<h2>Blocks built for selling</h2>
<div class="grid">
  <div class="card"><h3>🛍️ Catalog &amp; product cards</h3><p>Show products with price, description and link — as a browsable list or a single featured deal.</p></div>
  <div class="card"><h3>🔎 Product search</h3><p>Free-text keywords ("jacket", "bag") are matched to your catalog and answered with the right item.</p></div>
  <div class="card"><h3>🧾 Order tracking</h3><p>Order-status and tracking-link blocks — or fetch live status from your API with HTTP Request.</p></div>
  <div class="card"><h3>💳 Payments &amp; reviews</h3><p>Send UPI/Razorpay/Stripe links and request a review after the sale.</p></div>
</div>

<h2>Make it yours</h2>
<p>Replace TrendKart's products, prices, links and coupon with your own, wire the HTTP Request block to your Shopify/WooCommerce/order API if you want live data, and test in the simulator. More on the <a href="/whatsapp-bot-for-ecommerce">e-commerce bot page</a>.</p>
${CROSS}
</article>`,
  faqs: [
    { q: "Is the online store template free?", a: "Yes — load TrendKart, rebrand it, launch it and export its code for free. You pay only your WhatsApp provider's message costs." },
    { q: "Can it pull live order status from my store?", a: "Yes. The HTTP Request block can call your store's API (Shopify, WooCommerce or your own backend) with the customer's order ID and use the response in the reply." },
    { q: "Can customers browse and buy inside WhatsApp?", a: "Yes — the Mini Catalog lists products, Product Cards feature one item, Product Search matches keywords, and a Payment Link block collects payment. It's a conversation, not a static catalog." },
  ],
};

const BANK = {
  key: "bank",
  path: "/whatsapp-bot-templates/safebank-assistant",
  crumb: "Bank/support bot template",
  priority: "0.7",
  changefreq: "monthly",
  title: "Bank WhatsApp Bot Template — Free Customer Support Chatbot Demo",
  desc: "Load SafeBank, a free 19-block WhatsApp support bot template: account services, card block, loan lead capture, branch info, FAQs and secure agent handoff. Try it live and make it yours.",
  h1: "SafeBank — a free bank & support WhatsApp bot template",
  body: `
<article class="doc">
<p class="lead"><strong>SafeBank</strong> shows how to run a security-conscious support bot on WhatsApp — 19 blocks with language routing, self-service account actions, loan lead capture and a clean handoff to a human agent. It's a template for any business that answers sensitive support questions, not just banks.</p>

${flowMap("SafeBank picks a language, reminds users it never asks for OTPs/PINs, then offers:", [
  "💳 <strong>Account services</strong> — light verification (last 4 digits) then balance / mini-statement over SMS.",
  "🚫 <strong>Cards</strong> — block a card instantly or apply for a new one.",
  "🏠 <strong>Loans</strong> — qualifies the loan type and captures the lead's phone number.",
  "🏢 <strong>Branch &amp; timings</strong> — hours and nearest-branch info with business-hours logic.",
  "❓ <strong>FAQs</strong> — interest, IFSC, minimum balance, netbanking.",
  "🙋 <strong>Talk to an agent</strong> — human handoff.",
])}

<h2>Patterns worth stealing</h2>
<div class="grid">
  <div class="card"><h3>🔐 Safe-by-design copy</h3><p>The bot states up front it never asks for OTPs, PINs or passwords — a pattern any support bot should copy.</p></div>
  <div class="card"><h3>🌐 Language routing</h3><p>English / हिन्दी branches from the first message.</p></div>
  <div class="card"><h3>🎯 Lead qualification</h3><p>The loan branch qualifies interest and tags the lead for follow-up.</p></div>
  <div class="card"><h3>🤝 Human handoff</h3><p>Sensitive queries route straight to a live agent with an expected wait time.</p></div>
</div>

<h2>Make it yours</h2>
<p>Swap SafeBank's services, FAQs and rates for your own, and wire the HTTP Request block to your core systems if you want real lookups instead of demo replies. Test the whole flow in the simulator before you connect a provider.</p>
${CROSS}
</article>`,
  faqs: [
    { q: "Is the bank/support template free?", a: "Yes — SafeBank is free to load, edit, launch and export, like every FlowBot template. You pay only your WhatsApp provider's message costs." },
    { q: "Is it safe to handle account queries on WhatsApp?", a: "The template is deliberately conservative: it never asks for OTPs, PINs or passwords and uses only light verification (last-4-digits) for demo replies. For real balances or transactions, wire the HTTP Request block to your own authenticated backend and keep secrets server-side." },
    { q: "Can it capture loan or product leads?", a: "Yes — the Lead Qualification block asks what the customer wants, then a Collect Phone block captures the number and a Tag block marks them for your team to follow up." },
  ],
};

const CHESS = {
  key: "chess",
  path: "/whatsapp-bot-templates/grandmaster-chess-academy",
  crumb: "Coaching/academy bot template",
  priority: "0.7",
  changefreq: "monthly",
  title: "Class Booking WhatsApp Bot Template — Free Coaching/Academy Demo",
  desc: "Load GrandMaster Academy, a free 17-block WhatsApp bot template for coaching, classes and academies: trial booking by level, course catalog with payment, daily content and FAQs. Try it live.",
  h1: "GrandMaster Academy — a free class-booking WhatsApp bot template",
  body: `
<article class="doc">
<p class="lead"><strong>GrandMaster Chess Academy</strong> is a 17-block template for any classes, coaching or tuition business — it books free trials, sells courses and keeps students engaged. Chess is just the example; swap the copy and it fits a yoga studio, music school, or exam-prep tutor just as well.</p>

${flowMap("The academy assistant offers:", [
  "🎓 <strong>Book a FREE trial lesson</strong> — qualifies the student's level, collects name and email, and books an appointment.",
  "📚 <strong>Courses &amp; pricing</strong> — a course catalog with prices, a new-student coupon (CHESS20) and a payment link.",
  "🧩 <strong>Today's puzzle</strong> — daily content with a reveal-the-solution branch to keep students coming back.",
  "❓ <strong>Ask a question</strong> — FAQ on age, format, fees and timings.",
  "🙋 <strong>Contact the coach</strong> — human handoff.",
])}

<h2>The reusable coaching pattern</h2>
<div class="grid">
  <div class="card"><h3>🎯 Trial → enrol funnel</h3><p>Qualify by level, book a free trial, then present paid courses with a first-timer coupon — a proven education funnel.</p></div>
  <div class="card"><h3>🗓️ Appointment booking</h3><p>Collects a preferred day/time for the trial and confirms it with the meeting details.</p></div>
  <div class="card"><h3>🔁 Engagement hook</h3><p>The daily puzzle gives students a reason to message the bot again — reuse it for a daily tip or word of the day.</p></div>
  <div class="card"><h3>💳 Sell courses</h3><p>Catalog + coupon + payment link turns interest into a paid enrolment inside the chat.</p></div>
</div>

<h2>Make it yours</h2>
<p>Rename the academy, replace the levels, courses, prices and puzzle with your own subject, and test the trial-booking flow in the simulator. It works for any business that sells classes or sessions.</p>
${CROSS}
</article>`,
  faqs: [
    { q: "Is the coaching/academy template free?", a: "Yes — GrandMaster Academy is free to load, edit, launch and export as code. You pay only your WhatsApp provider's message costs." },
    { q: "Can it book classes and take payments?", a: "Yes. It qualifies the student's level, collects name and email, books a trial via the Appointment block, and sells paid courses with a catalog, coupon and Payment Link — all in one flow." },
    { q: "Does this only work for chess?", a: "No — chess is just the example. Every block is editable, so the same trial-to-enrolment pattern fits any classes, coaching or tuition business: music, yoga, fitness, exam prep and more." },
  ],
};

const GYM = {
  key: "gym",
  path: "/whatsapp-bot-templates/powerfit-gym",
  crumb: "Gym/fitness bot template",
  priority: "0.7",
  changefreq: "monthly",
  title: "Gym WhatsApp Bot Template — Free Trial Booking & Memberships",
  desc: "Load PowerFit Gym, a free 17-block WhatsApp bot template for gyms & fitness studios: free-trial booking, membership plans with payment, class timings, location, FAQ and trainer handoff. Try it live.",
  h1: "PowerFit Gym — a free gym & fitness WhatsApp bot template",
  body: `
<article class="doc">
<p class="lead"><strong>PowerFit Gym</strong> is a ready-to-launch bot for gyms, fitness studios and personal trainers — 17 blocks that turn WhatsApp into a front desk: book free trials, sell memberships, share class timings and answer the questions members ask all day. Load it into the <a href="/app">builder</a>, rebrand it, and it's your gym's bot.</p>

${flowMap("PowerFit greets the member and offers:", [
  "🏋️ <strong>Book a FREE trial</strong> — qualifies the fitness goal, collects name and phone, books a slot and confirms the session.",
  "💳 <strong>Membership plans</strong> — a plan catalog with prices, a new-member coupon (FIT20) and a payment link.",
  "🗓️ <strong>Class timings</strong> — the weekly schedule plus a Google Maps location.",
  "❓ <strong>FAQs</strong> — trial, timings, personal training and fees.",
  "🙋 <strong>Talk to a trainer</strong> — human handoff.",
])}

<h2>The reusable fitness pattern</h2>
<div class="grid">
  <div class="card"><h3>🎯 Free trial → member</h3><p>Qualify the goal, book a free session, then present paid plans with a first-timer coupon — the classic gym funnel.</p></div>
  <div class="card"><h3>🗓️ Slot booking</h3><p>Appointment + booking-confirm blocks capture a preferred day/time and reply with a confirmation.</p></div>
  <div class="card"><h3>💳 Sell memberships</h3><p>Plan catalog, coupon and payment link turn interest into a paid membership inside the chat.</p></div>
  <div class="card"><h3>🤝 Trainer handoff</h3><p>Anything the bot can't answer routes to a human trainer, with a friendly wait message.</p></div>
</div>

<h2>Make it yours</h2>
<p>Rename the gym, swap the plans, prices, class schedule and location for your own, and test the free-trial flow in the simulator before you connect a provider. The same pattern fits yoga studios, CrossFit boxes, dance classes and personal trainers.</p>
${CROSS}
</article>`,
  faqs: [
    { q: "Is the gym bot template free?", a: "Yes — PowerFit Gym is free to load, edit, launch and export as code, like every FlowBot template. You pay only your WhatsApp provider's message costs." },
    { q: "Can members book a free trial and pay for memberships in the bot?", a: "Yes. The template qualifies the member's goal, books a trial via the Appointment block, and sells memberships with a plan catalog, a coupon (FIT20) and a Payment Link — all in one flow." },
    { q: "Does this only work for gyms?", a: "No — every block is editable, so the same free-trial-to-membership pattern fits yoga and dance studios, CrossFit boxes, martial-arts schools and personal trainers." },
  ],
};

/* ------------------------------ exports ------------------------------ */

// Prepend the per-template "open this bot" promo band, and show the
// exit-intent CTA (renderPage handles it) like the comparison pages do.
const pages = [RESTAURANT, HOTEL, STORE, BANK, CHESS, GYM].map((p) => ({
  ...p,
  body: promo(p.key) + p.body,
  exitIntent: true,
}));

// sitemap/llms entries — same shape docs.entries / compare.entries use.
const entries = pages.map((p) => ({
  path: p.path,
  title: p.title,
  desc: p.desc,
  priority: p.priority,
  changefreq: p.changefreq,
}));

module.exports = { pages, entries };
