// ============================================================
// Documentation — server-rendered /docs pages.
// Same chrome as the marketing pages (see seo.js) with a docs
// sidebar, prev/next links and TechArticle structured data.
// Content is grounded in the actual engine (engine.js), codegen
// and widget behavior — keep it in sync when those change.
// ============================================================

const seo = require("./seo");
const { CANONICAL } = seo;

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------ pages ------------------------------ */

const DOCS = [
  {
    slug: "",
    navLabel: "Overview",
    title: "FlowBot Docs — Build, Test & Launch WhatsApp Bots",
    desc: "Documentation for FlowBot, the free drag-and-drop WhatsApp bot builder: getting started, block reference, variables, going live on four providers, website widget, code export.",
    h1: "FlowBot documentation",
    body: `
<p class="lead">Everything you need to go from a blank canvas to a live bot. FlowBot bots are <strong>deterministic flowcharts</strong>: blocks are steps in the conversation, wires decide what happens next, and the same engine runs your bot everywhere — in the simulator, on WhatsApp, in the website widget, and inside exported code.</p>

<div class="grid">
  <div class="card"><h3><a href="/docs/getting-started">🚀 Getting started</a></h3><p>Build and test your first bot in about ten minutes — no account needed.</p></div>
  <div class="card"><h3><a href="/docs/blocks">🧱 Block reference</a></h3><p>All 40 built-in blocks: what each one does, how it branches, which variables it sets.</p></div>
  <div class="card"><h3><a href="/docs/variables">🔤 Variables</a></h3><p>Collect answers, reuse them with {curly} placeholders, branch on them with conditions.</p></div>
  <div class="card"><h3><a href="/docs/block-lab">🧪 Block Lab</a></h3><p>Invent your own blocks from simple steps — say, ask, set, call an API, AI chat, choices.</p></div>
  <div class="card"><h3><a href="/docs/go-live">📡 Going live</a></h3><p>Connect Meta WhatsApp Cloud API, Twilio, Green API or Whapi.cloud, step by step.</p></div>
  <div class="card"><h3><a href="/docs/widget-and-sharing">🌐 Widget & sharing</a></h3><p>Put the bot on your website with one script tag; share pages and cloning.</p></div>
  <div class="card"><h3><a href="/docs/ai-features">✨ AI features</a></h3><p>AI Builder and the AI Reply block — optional, with your own API key.</p></div>
  <div class="card"><h3><a href="/docs/code-export">📦 Code export</a></h3><p>Download your bot as a standalone Node.js project and host it anywhere.</p></div>
</div>

<h2>How a FlowBot bot works</h2>
<p>Every conversation starts at the <strong>Welcome Message</strong> block. When a customer sends a message, the engine walks the flowchart from wherever that customer currently is: message blocks send text and continue along their wire; interactive blocks (menus, questions, FAQs) send their prompt and wait for the reply. Each customer has their own session — their position in the flow plus every variable collected so far — stored server-side and kept for 12 hours of inactivity. A <strong>Goodbye</strong> block ends the session, so the next message starts fresh from Welcome.</p>
<p>There is no AI in the runtime unless you explicitly add an AI block with your own key — flows run exactly as drawn, every time.</p>`,
  },

  {
    slug: "getting-started",
    navLabel: "Getting started",
    title: "Getting Started — FlowBot Docs",
    desc: "Build your first WhatsApp bot in FlowBot in ten minutes: drag blocks, wire them, test in the live simulator, then activate on a real number or your website.",
    h1: "Getting started",
    body: `
<p class="lead">You can build and test a complete bot without creating an account. You only need to sign up when you want to save your bot or take it live.</p>

<h2>1. Open the builder</h2>
<p>Go to <a href="/app">the builder</a>. You'll see a canvas with a small demo flow, a block palette on the left, and settings on the right. On a first visit a 60-second tour walks you through everything.</p>

<h2>2. Add and wire blocks</h2>
<ul>
  <li><strong>Add a block:</strong> drag it from the palette onto the canvas (or tap it on mobile).</li>
  <li><strong>Connect blocks:</strong> drag from a block's round <em>output port</em> (right edge) to another block. Blocks like Menu Options have one output port per option.</li>
  <li><strong>Configure:</strong> click a block and edit its text and options in the panel on the right. Plain form fields — no code.</li>
  <li><strong>Delete a wire or block:</strong> click it and use the delete control.</li>
</ul>
<p>Every flow needs exactly one <strong>Welcome Message</strong> block — it's the entry point. A flow can have up to 150 blocks.</p>

<h2>3. Start from a template or the AI Builder (optional)</h2>
<p>The <em>“Start from template…”</em> menu loads a complete working bot — restaurant, hotel, online store, bank or chess academy — that you can edit freely. Or open <strong>✨ AI Builder</strong>, paste your own LLM API key, and describe the bot you want; it drafts the whole flowchart for you (see <a href="/docs/ai-features">AI features</a>).</p>

<h2>4. Test in the simulator</h2>
<p>Switch to the <em>Activate &amp; test</em> tab and chat with your bot. The simulator runs the exact same engine as production — menus, variables, API calls and branches behave identically to WhatsApp. Use the reset button to start the conversation over.</p>

<h2>5. Go live</h2>
<p>Three ways to put your bot in front of people:</p>
<ul>
  <li><strong>WhatsApp:</strong> connect Meta Cloud API, Twilio, Green API or Whapi.cloud — see <a href="/docs/go-live">Going live</a>.</li>
  <li><strong>Your website:</strong> enable the chat widget and paste one script tag — see <a href="/docs/widget-and-sharing">Widget &amp; sharing</a>.</li>
  <li><strong>Your own server:</strong> export the bot as a Node.js project — see <a href="/docs/code-export">Code export</a>.</li>
</ul>

<h2>Good to know</h2>
<ul>
  <li>Saving requires a free account; the <em>Save</em> button will prompt you to sign up when needed.</li>
  <li>Customers can always answer menus with the option <em>number</em> ("2"), the exact option text, or an unambiguous prefix of it.</li>
  <li>If a branch dead-ends, the bot replies "✅ That's all for now. Send any message to start over." rather than going silent.</li>
</ul>`,
  },

  {
    slug: "blocks",
    navLabel: "Block reference",
    title: "Block Reference (All 40 Blocks) — FlowBot Docs",
    desc: "Complete reference for FlowBot's 40 WhatsApp bot blocks: messages, menus, data collection, e-commerce, bookings, routing logic, HTTP requests and AI — with branching and variables.",
    h1: "Block reference",
    body: `
<p class="lead">Every built-in block, grouped by what it's for. <em>Ports</em> are the outputs you wire to the next block — most blocks have one; branching blocks have several. <em>Sets</em> lists the <a href="/docs/variables">variables</a> a block saves.</p>

<h2>Conversation basics</h2>
<div class="tablewrap"><table>
<tr><th>Block</th><th>What it does</th><th>Ports / sets</th></tr>
<tr><td><b>Welcome Message</b></td><td>The entry point — greets the customer on their first message. Every flow needs exactly one.</td><td>1 port</td></tr>
<tr><td><b>Text Message</b></td><td>Sends a message and continues immediately.</td><td>1 port</td></tr>
<tr><td><b>Menu Options</b></td><td>Numbered menu. Customers reply with the number, the option text, or a unique prefix.</td><td>1 port per option · sets <code>{choice}</code>, <code>{menu_choice}</code></td></tr>
<tr><td><b>Quick Replies</b></td><td>Same behavior as Menu Options with lighter phrasing — good for yes/no and short choices.</td><td>1 port per option · sets <code>{choice}</code></td></tr>
<tr><td><b>FAQ Auto-Reply</b></td><td>Keyword → answer table. Replies whenever the customer's message contains a keyword; customer types <code>0</code> to move on.</td><td>1 port (after "0")</td></tr>
<tr><td><b>Goodbye / Handoff</b></td><td>Ends the conversation and clears the session — the next message starts fresh at Welcome.</td><td>ends flow</td></tr>
</table></div>

<h2>Collecting information</h2>
<div class="tablewrap"><table>
<tr><th>Block</th><th>What it does</th><th>Ports / sets</th></tr>
<tr><td><b>Collect Info</b></td><td>Asks a question and saves the answer into a variable name you choose.</td><td>1 port · sets your field</td></tr>
<tr><td><b>Collect Number</b></td><td>Asks for a number; re-asks until the reply contains digits.</td><td>1 port · sets your field</td></tr>
<tr><td><b>Collect Email</b></td><td>Asks for an email and validates the format.</td><td>1 port · sets <code>{email}</code></td></tr>
<tr><td><b>Collect Phone</b></td><td>Asks for a phone number (min. 7 digits).</td><td>1 port · sets <code>{phone}</code></td></tr>
<tr><td><b>Collect Address</b></td><td>Asks for a delivery/postal address.</td><td>1 port · sets <code>{address}</code></td></tr>
<tr><td><b>Feedback</b></td><td>Free-text feedback prompt.</td><td>1 port · sets <code>{feedback}</code></td></tr>
<tr><td><b>Lead Qualification</b></td><td>A menu specialized for qualifying leads (budget, timeline, intent…).</td><td>1 port per option · sets <code>{choice}</code></td></tr>
</table></div>

<h2>E-commerce</h2>
<div class="tablewrap"><table>
<tr><th>Block</th><th>What it does</th><th>Ports / sets</th></tr>
<tr><td><b>Product Card</b></td><td>Sends one product: name, price, description, link.</td><td>1 port</td></tr>
<tr><td><b>Mini Catalog</b></td><td>Sends a numbered list of products with prices.</td><td>1 port</td></tr>
<tr><td><b>Product Search</b></td><td>Asks what the customer wants, matches keywords against your product list, replies with the hit.</td><td>port 0 found · port 1 not found</td></tr>
<tr><td><b>Order Status</b></td><td>Asks for the order ID and acknowledges — pair with HTTP Request for live status.</td><td>1 port · sets <code>{orderId}</code></td></tr>
<tr><td><b>Tracking Link</b></td><td>Asks for a tracking ID and replies with your base URL + the ID.</td><td>1 port · sets <code>{trackingId}</code></td></tr>
<tr><td><b>Payment Link</b></td><td>Sends a payment URL (UPI, Razorpay, Stripe — any link).</td><td>1 port</td></tr>
<tr><td><b>Coupon Code</b></td><td>Sends a coupon code with a message.</td><td>1 port</td></tr>
<tr><td><b>Cart Recovery</b></td><td>A nudge message for unfinished checkouts — pair with a coupon.</td><td>1 port</td></tr>
<tr><td><b>Return Policy</b> / <b>Shipping Info</b></td><td>Pre-worded policy answers you customize.</td><td>1 port each</td></tr>
<tr><td><b>Review Request</b></td><td>Asks the customer to leave a review, with your link.</td><td>1 port</td></tr>
</table></div>

<h2>Bookings</h2>
<div class="tablewrap"><table>
<tr><th>Block</th><th>What it does</th><th>Ports / sets</th></tr>
<tr><td><b>Appointment Booking</b></td><td>Asks for a date/time and saves it.</td><td>1 port · sets <code>{appointmentTime}</code></td></tr>
<tr><td><b>Booking Confirm</b></td><td>Sends a confirmation message — typically references <code>{appointmentTime}</code> and <code>{name}</code>.</td><td>1 port</td></tr>
</table></div>

<h2>Routing &amp; logic</h2>
<div class="tablewrap"><table>
<tr><th>Block</th><th>What it does</th><th>Ports / sets</th></tr>
<tr><td><b>Condition</b></td><td>Compares a variable against a value (<em>equals</em> or <em>contains</em>, case-insensitive). If the variable was never set, the bot asks for it first instead of silently branching.</td><td>port 0 true · port 1 false</td></tr>
<tr><td><b>Language Router</b></td><td>A menu of languages; route each option to a branch written in that language.</td><td>1 port per language · sets <code>{language}</code></td></tr>
<tr><td><b>Business Hours</b></td><td>Checks the server clock against your open/close hours (overnight ranges supported) and branches.</td><td>port 0 open · port 1 closed</td></tr>
<tr><td><b>Set Variable</b></td><td>Sets a variable to a fixed (or interpolated) value.</td><td>1 port</td></tr>
<tr><td><b>Save Note</b></td><td>Stores an internal note into a variable — useful for tagging steps of the journey.</td><td>1 port</td></tr>
<tr><td><b>Tag Customer</b></td><td>Appends a tag to the customer's <code>{tags}</code> list. Leave the message empty to tag silently.</td><td>1 port</td></tr>
</table></div>

<h2>Support</h2>
<div class="tablewrap"><table>
<tr><th>Block</th><th>What it does</th><th>Ports / sets</th></tr>
<tr><td><b>Human Handoff</b></td><td>Tells the customer a person will take over and sets <code>{handoff}</code> = "true" so later logic can behave differently.</td><td>1 port</td></tr>
<tr><td><b>CSAT Rating</b></td><td>Asks for a 1–5 rating. You can wire a different branch per score; unwired scores follow the first wired port.</td><td>up to 5 ports · sets <code>{rating}</code></td></tr>
<tr><td><b>Contact Card</b></td><td>Sends phone / email / website details.</td><td>1 port</td></tr>
<tr><td><b>Location / Map</b></td><td>Sends your address with an optional directions link.</td><td>1 port</td></tr>
<tr><td><b>Send Link</b> / <b>Image / Media Link</b></td><td>Sends a URL or an image/media link with a caption.</td><td>1 port each</td></tr>
</table></div>

<h2>Power blocks</h2>
<div class="tablewrap"><table>
<tr><th>Block</th><th>What it does</th><th>Ports / sets</th></tr>
<tr><td><b>HTTP Request / API</b></td><td>Calls any external API mid-flow (GET/POST/PUT/PATCH/DELETE) with <code>{vars}</code> interpolated into the URL, headers and body. Optionally narrows a JSON response with a dot-path (e.g. <code>data.status</code>) and saves it. 10-second timeout; private/localhost addresses are blocked on the hosted service.</td><td>port 0 success · port 1 error · sets <code>{apiResult}</code> (your name) and <code>{apiResult_error}</code> on failure</td></tr>
<tr><td><b>AI Reply</b></td><td>Open-ended AI chat using <em>your own</em> Anthropic, OpenAI-compatible or Gemini key. The customer chats freely until they type <code>0</code> (or "exit"/"menu"/"back"), then the flow continues. See <a href="/docs/ai-features">AI features</a>.</td><td>1 port (after exit)</td></tr>
<tr><td><b>Custom blocks</b></td><td>Anything you build in the <a href="/docs/block-lab">Block Lab</a> — chains of say/ask/set/API/AI/choice steps.</td><td>1 port, or 1 per option if it ends in a choice step</td></tr>
</table></div>`,
  },

  {
    slug: "variables",
    navLabel: "Variables",
    title: "Variables & Personalization — FlowBot Docs",
    desc: "How FlowBot variables work: {curly} placeholders, which blocks set which variables, automatic collection of missing values, and branching with the Condition block.",
    h1: "Variables",
    body: `
<p class="lead">Variables let your bot remember what the customer said and reuse it: <em>"Thanks {name}, your order {order_id} ships tomorrow."</em> Each customer's variables live in their own session.</p>

<h2>Using a variable</h2>
<p>Write <code>{variable_name}</code> inside any block's text — messages, questions, prompts, links, even HTTP request URLs and bodies. The engine replaces it with the customer's value at send time. If a variable was never set, the placeholder stays visible as <code>{variable_name}</code> so you notice it in testing instead of silently sending an empty gap.</p>

<h2>Setting variables</h2>
<p>Collection blocks save the customer's answer automatically:</p>
<div class="tablewrap"><table>
<tr><th>Block</th><th>Variable</th></tr>
<tr><td>Collect Info / Collect Number / Set Variable / Save Note</td><td>the field name you choose</td></tr>
<tr><td>Collect Email / Phone / Address</td><td><code>{email}</code> / <code>{phone}</code> / <code>{address}</code></td></tr>
<tr><td>Order Status / Tracking Link / Appointment / Feedback</td><td><code>{orderId}</code> / <code>{trackingId}</code> / <code>{appointmentTime}</code> / <code>{feedback}</code></td></tr>
<tr><td>Any menu (Menu, Quick Replies, Language, Lead Qualification)</td><td><code>{choice}</code> — plus <code>{menu_choice}</code>-style per type, and <code>{language}</code> for the Language Router</td></tr>
<tr><td>CSAT Rating</td><td><code>{rating}</code> (1–5)</td></tr>
<tr><td>Tag Customer</td><td>appends to <code>{tags}</code> (comma-separated)</td></tr>
<tr><td>Human Handoff</td><td><code>{handoff}</code> = "true"</td></tr>
<tr><td>HTTP Request / API step</td><td>the field you choose (default <code>{apiResult}</code>); on failure <code>{apiResult_error}</code></td></tr>
</table></div>

<h2>Auto-collect: missing variables ask for themselves</h2>
<p>If a block is about to show a <code>{var}</code> nobody collected yet, the bot pauses and asks for it first — <em>"Before we continue — please share your delivery address:"</em> — saves the answer under that name, then runs the block as intended. This means you can reference <code>{name}</code> in a Booking Confirm without wiring a Collect block first; the engine fills the gap. The same applies to a Condition block on an unset variable: it asks instead of silently branching false.</p>
<p>Custom blocks get the same treatment: a <code>{var}</code> used in a <a href="/docs/block-lab">Block Lab</a> step is auto-collected up front <em>unless another step in that same block provides it</em> (an <em>ask</em> or <em>set</em> step, or an API step's saved result). So a "say" step reading <em>"Hey {name}!"</em> asks for the name before greeting, while a variable the block asks for later is left for that step to collect.</p>

<h2>Branching on variables</h2>
<p>The <strong>Condition</strong> block compares a variable to a value with <em>equals</em> or <em>contains</em> (both case-insensitive) and branches: port 0 when true, port 1 when false. Combine with menu choices — e.g. after a menu, <code>{choice}</code> contains "veg" → route to the vegetarian menu.</p>

<h2>Session lifetime</h2>
<p>A customer's position and variables persist across messages (and across server restarts) for 12 hours of inactivity. A <strong>Goodbye</strong> block clears everything immediately; the customer's next message starts a fresh conversation at Welcome.</p>`,
  },

  {
    slug: "block-lab",
    navLabel: "Block Lab",
    title: "Block Lab: Build Custom Blocks — FlowBot Docs",
    desc: "Create your own FlowBot blocks from simple steps — say, ask (with validation), set variable, call an API, AI chat and multi-option choices. Up to 30 steps per block.",
    h1: "Block Lab — build your own blocks",
    body: `
<p class="lead">When no built-in block fits — a quiz, an EMI check, a visitor pass — build your own in the Block Lab. A custom block is a chain of simple <strong>steps</strong> that runs top to bottom; once saved it appears in your palette and works everywhere: simulator, live WhatsApp, the website widget and exported code.</p>

<h2>The six step kinds</h2>
<div class="tablewrap"><table>
<tr><th>Step</th><th>What it does</th></tr>
<tr><td><b>Send message</b></td><td>Sends text (with <code>{vars}</code>) and moves to the next step.</td></tr>
<tr><td><b>Ask &amp; save answer</b></td><td>Asks a question, waits for the reply, saves it into a variable. Optional validation: <em>text</em>, <em>number</em>, <em>email</em> or <em>phone</em> — invalid replies are re-asked with a helpful message. Optional acknowledgement text.</td></tr>
<tr><td><b>Set variable</b></td><td>Sets a variable to a fixed or interpolated value, silently.</td></tr>
<tr><td><b>Call an API (HTTP)</b></td><td>Same engine as the HTTP Request block: method, URL, headers, body, optional JSON dot-path, saves the response into a variable. On failure it sends your error message and continues.</td></tr>
<tr><td><b>AI chat</b></td><td>Hands the conversation to an LLM (your own key) until the customer types <code>0</code>, then continues with the remaining steps. See <a href="/docs/ai-features">AI features</a>.</td></tr>
<tr><td><b>Choices (branches)</b></td><td>Shows 1–8 numbered options. <em>Must be the last step</em> that branches: the chosen option number becomes the block's output port, so a block ending in choices has one port per option.</td></tr>
</table></div>

<h2>Rules and limits</h2>
<ul>
  <li>Up to <strong>30 steps</strong> per custom block; a choice step offers 1–8 options.</li>
  <li>Steps pause automatically where input is needed (ask, AI, choice) and resume exactly there on the customer's next message.</li>
  <li>Custom blocks are saved to your account and reusable across all your bots.</li>
  <li>The AI Builder can also invent custom blocks for you when a feature you describe has no built-in equivalent.</li>
</ul>

<h2>Example: a 2-question quiz</h2>
<ol class="steps">
  <li><em>Send message</em> — "Quick quiz! Get both right for a coupon 🎉"</li>
  <li><em>Ask</em> — "Q1: Which planet is closest to the sun?" → save to <code>q1</code></li>
  <li><em>Ask</em> — "Q2: 7 × 8?" (validate: number) → save to <code>q2</code></li>
  <li><em>Choices</em> — "Want your result?" · options: <em>Yes</em> / <em>No</em> — wire port 1 (Yes) to a Condition block chain that checks <code>{q1}</code>/<code>{q2}</code> and sends a Coupon Code.</li>
</ol>`,
  },

  {
    slug: "go-live",
    navLabel: "Going live",
    title: "Going Live on WhatsApp: Meta, Twilio, Green API, Whapi — FlowBot Docs",
    desc: "Step-by-step provider setup to put your FlowBot bot on a real WhatsApp number: Meta Cloud API webhooks and verify token, Twilio sandbox, Green API and Whapi.cloud QR pairing.",
    h1: "Going live on WhatsApp",
    body: `
<p class="lead">Save your bot, open the <em>Activate &amp; test</em> tab, pick a provider and paste its credentials. FlowBot stores them server-side, activates the bot, and shows you the <strong>webhook URL</strong> to paste back into the provider's dashboard. From then on, messages to your number run your flow in real time.</p>

<h2>Which provider?</h2>
<div class="tablewrap"><table>
<tr><th>Provider</th><th>Best for</th><th>Notes</th></tr>
<tr><td><b>Meta WhatsApp Cloud API</b></td><td>Production business bots</td><td>The official API. Free test number to start; user-initiated service conversations have a free tier.</td></tr>
<tr><td><b>Twilio</b></td><td>Fast demos, teams already on Twilio</td><td>The sandbox gets you chatting in minutes; per-message pricing.</td></tr>
<tr><td><b>Green API</b></td><td>Small businesses on a regular WhatsApp account</td><td>Pairs with your existing WhatsApp via QR. Unofficial — linked-device ban risk applies.</td></tr>
<tr><td><b>Whapi.cloud</b></td><td>Same as Green API, alternative vendor</td><td>QR pairing, free sandbox. Same unofficial-API caveat.</td></tr>
</table></div>

<h2>Meta WhatsApp Cloud API (official)</h2>
<ol class="steps">
  <li>At <a href="https://developers.facebook.com" rel="noopener">developers.facebook.com</a>, create an app and add the <strong>WhatsApp</strong> product. Meta gives you a free test number.</li>
  <li>From the WhatsApp → API Setup page, copy the <strong>access token</strong> and the <strong>phone number ID</strong>.</li>
  <li>In FlowBot's activation panel choose <em>Meta</em>, paste both, and activate. FlowBot shows your <strong>callback/webhook URL</strong> and a <strong>verify token</strong>.</li>
  <li>Back in Meta's dashboard (WhatsApp → Configuration → Webhook), paste the callback URL and verify token, then <strong>subscribe to the "messages" field</strong>.</li>
  <li>Message your test number — the flow answers. To go beyond test mode, connect a real business number and complete Meta's business verification.</li>
</ol>
<p>Replies your bot sends to customers who message first count as service conversations. Business-initiated template messages are a separate, approval-based feature that FlowBot flows don't require.</p>

<h2>Twilio</h2>
<ol class="steps">
  <li>From the Twilio Console copy your <strong>Account SID</strong> and <strong>Auth Token</strong>, and note your WhatsApp-enabled number (the sandbox number works: join it by sending its code phrase).</li>
  <li>In FlowBot choose <em>Twilio</em>, paste SID, token and the number, and activate. FlowBot shows the webhook URL.</li>
  <li>In Twilio (Messaging → WhatsApp sandbox settings, or your number's configuration) set <strong>"When a message comes in"</strong> to that URL (HTTP POST).</li>
</ol>

<h2>Green API</h2>
<ol class="steps">
  <li>Create an instance at <a href="https://green-api.com" rel="noopener">green-api.com</a> and copy the <strong>idInstance</strong> and <strong>apiTokenInstance</strong>.</li>
  <li>Pair your WhatsApp by scanning the QR from the Green API console.</li>
  <li>In FlowBot choose <em>Green API</em>, paste both values, activate, and set the webhook URL FlowBot gives you in the instance settings (incoming message notifications on).</li>
</ol>

<h2>Whapi.cloud</h2>
<ol class="steps">
  <li>At <a href="https://panel.whapi.cloud" rel="noopener">panel.whapi.cloud</a> create a channel/sandbox and pair by QR; copy the <strong>API token</strong>.</li>
  <li>In FlowBot choose <em>Whapi</em>, paste the token, activate, and set FlowBot's webhook URL in the channel's webhook settings.</li>
</ol>

<h2>After activation</h2>
<ul>
  <li>The bot list marks the flow <em>live</em>; edits you save take effect on the next message.</li>
  <li>Use <em>Deactivate</em> to pause the bot; the flow and credentials stay saved.</li>
  <li>Conversations survive server restarts — a customer mid-order continues where they left off (12-hour idle timeout).</li>
  <li>Message volume shows up in <a href="/docs/widget-and-sharing">analytics</a>, per channel.</li>
</ul>`,
  },

  {
    slug: "widget-and-sharing",
    navLabel: "Widget & sharing",
    title: "Website Chat Widget, Share Pages & Analytics — FlowBot Docs",
    desc: "Embed your FlowBot bot on any website with one script tag, publish a public share page where anyone can try and clone it, and read the built-in 30-day analytics.",
    h1: "Website widget, share pages & analytics",
    body: `
<p class="lead">Every bot can also live outside WhatsApp: as a chat bubble on your own website, and as a public share page anyone can try. Both run the exact same flow through a public, rate-limited API — your provider credentials and AI keys never leave the server. Open <strong>📣 Share</strong> in the builder header to manage all of it.</p>

<h2>Website chat widget</h2>
<ol class="steps">
  <li>Open your bot in the builder → <strong>📣 Share</strong> → toggle on <em>Website chat widget</em>.</li>
  <li>Copy the snippet and paste it just before <code>&lt;/body&gt;</code> on your site:</li>
</ol>
<pre><code>&lt;script src="${CANONICAL}/widget.js" data-flowbot="YOUR_KEY" async&gt;&lt;/script&gt;</code></pre>
<p>A green chat bubble appears bottom-right; clicking it opens the conversation. Each visitor gets their own session (kept in their browser, 12-hour idle timeout server-side). The widget works on any site — WordPress, Shopify, plain HTML — because it's a single script tag with no dependencies.</p>
<ul>
  <li><strong>Flood protection:</strong> the public chat API allows 20 messages per 30 seconds per visitor.</li>
  <li><strong>Instant updates:</strong> save the flow in the builder and the widget serves the new version on the next message — no re-embedding.</li>
  <li>Turning the toggle off disables the widget everywhere immediately.</li>
</ul>

<h2>Public share page</h2>
<p>Toggle on <em>Public share page</em> to get a link like <code>${CANONICAL}/share/YOUR_KEY</code>. Anyone who opens it sees your bot's flowchart, chats with it live in the browser, and can <strong>clone it</strong> into their own builder canvas with one click. Great for portfolios, client approvals, and showing off in communities.</p>
<p><strong>Secrets are stripped before cloning:</strong> the clone endpoint blanks AI API keys, removes HTTP header values and drops URL query strings from API blocks — the person cloning gets your flow's structure and copy, never your credentials.</p>

<h2>Analytics</h2>
<p>The Share panel also shows the last 30 days for the open bot:</p>
<ul>
  <li><strong>Conversations</strong> — unique sessions across all channels.</li>
  <li><strong>Messages received / replies sent</strong> — with a per-day bar strip.</li>
  <li><strong>Channel breakdown</strong> — meta, twilio, green, whapi and widget (share-page chats count as widget). Simulator traffic is excluded.</li>
</ul>`,
  },

  {
    slug: "ai-features",
    navLabel: "AI features",
    title: "AI Builder & AI Reply Block (BYOK) — FlowBot Docs",
    desc: "FlowBot's optional AI: the AI Builder that drafts flowcharts from a description, and the AI Reply block for open-ended chat — both using your own Anthropic, OpenAI or Gemini key.",
    h1: "AI features (bring your own key)",
    body: `
<p class="lead">FlowBot's runtime is deterministic by default — AI only enters your bot where you explicitly add it, and always with <strong>your own API key</strong>. Supported providers: Anthropic (Claude), OpenAI and OpenAI-compatible endpoints (Groq, OpenRouter, Mistral… via a custom base URL), and Google Gemini.</p>

<h2>AI Builder — describe a bot, get the flowchart</h2>
<p>Open <strong>✨ AI Builder</strong> in the header, choose a provider, paste your key (it's stored only in your browser's localStorage, never on FlowBot's servers), and describe what you want: <em>"A bot for my Italian restaurant in Pune — menu, table booking, opening hours and AI support."</em> The assistant draws the whole flowchart on your canvas, inventing custom blocks where no built-in fits. Keep chatting to refine it; <em>↩ Undo</em> restores the flow from before the last AI edit. Every generated flow is validated before it reaches your canvas.</p>

<h2>AI Reply block — open-ended chat inside a flow</h2>
<p>Drop an <strong>AI Reply</strong> block anywhere (e.g. behind a "Talk to our assistant" menu option) and configure:</p>
<ul>
  <li><strong>Provider + API key</strong> — stored with your bot's flow server-side, used only server-side to call the provider; never sent to visitors and stripped from share-page clones.</li>
  <li><strong>Business context</strong> — the system prompt: who you are, tone, facts it may use. <code>{vars}</code> work here too.</li>
  <li><strong>Model</strong> (optional) — defaults: <code>claude-haiku-4-5</code>, <code>gpt-4o-mini</code>, <code>gemini-2.5-flash</code>.</li>
</ul>
<p>While the block is active, every customer message goes to the LLM with the last few turns of context (replies are capped at 500 tokens). The customer types <code>0</code> — or "exit", "menu", "back" — to leave AI chat and continue the flow. If the provider errors, the bot sends your fallback message instead of going silent.</p>

<h2>AI step in custom blocks</h2>
<p>The <a href="/docs/block-lab">Block Lab</a> has the same capability as a step — AI chat until <code>0</code>, then the remaining steps run. Use it to build features like "AI answers questions about the menu, then asks for the order".</p>

<h2>Cost &amp; privacy notes</h2>
<ul>
  <li>You pay your AI provider directly at their rates; FlowBot adds no markup and no quota.</li>
  <li>Deterministic parts of your flow (orders, prices, bookings) are untouched by AI — the LLM only sees the conversation inside its own block.</li>
</ul>`,
  },

  {
    slug: "code-export",
    navLabel: "Code export",
    title: "Code Export: Self-Host Your Bot (Node.js) — FlowBot Docs",
    desc: "Export any FlowBot bot as a standalone Node.js + Express project: what's in the ZIP, how to run it with npm, deploying to Railway/Render/a VPS, and editing the generated code.",
    h1: "Code export & self-hosting",
    body: `
<p class="lead">The <em>Bot code</em> tab shows your entire bot as a single readable file, and one click downloads a ZIP of a complete project. The export is <strong>standalone</strong> — it contains your flow, the engine and the provider webhook, and never talks to FlowBot again.</p>

<h2>What's in the ZIP</h2>
<div class="tablewrap"><table>
<tr><th>File</th><th>Contents</th></tr>
<tr><td><code>server.js</code></td><td>Everything: your flow as a JSON object at the top, the deterministic engine, and the webhook wiring for the provider your bot was configured with (Meta, Twilio, Green API or Whapi).</td></tr>
<tr><td><code>package.json</code></td><td>One dependency (Express). Requires Node 20+.</td></tr>
<tr><td><code>.env.example</code></td><td>Template for your provider credentials.</td></tr>
<tr><td><code>README.md</code></td><td>Quick start + provider-specific connection steps.</td></tr>
</table></div>

<h2>Run it</h2>
<pre><code>npm install
cp .env.example .env    # fill in your provider credentials
npm run start:env       # listens on :3000</code></pre>
<p>Credentials you had entered in FlowBot are also baked in as fallbacks, so a plain <code>npm start</code> works out of the box. Point your provider's webhook at your server's public URL (the README shows the exact path) and the bot is live.</p>

<h2>Deploying</h2>
<ul>
  <li><strong>Railway / Render / Fly:</strong> push the project to a repo, create a service, set the env vars — done. The server binds <code>:3000</code> (or the platform's <code>PORT</code>).</li>
  <li><strong>VPS:</strong> run under <code>systemd</code> or <code>pm2</code>, put nginx/Caddy in front for HTTPS (providers require an https webhook).</li>
  <li>Exported bots keep sessions in memory — a restart resets in-progress conversations. Add your own store if you need more.</li>
</ul>

<h2>Editing the generated code</h2>
<p>It's plain JavaScript with no framework beyond Express. The conversation lives in the <code>FLOW</code> object (nodes = blocks, edges = wires) — you can tweak copy directly, or add anything Node.js can do around the engine: database writes, notifications, custom integrations. For bigger flow changes it's usually faster to edit visually in FlowBot and download a fresh ZIP.</p>

<h2>Why this matters</h2>
<p>The export is your exit route: no lock-in, no subscription, host in your own country or VPC for compliance, and hand the code to any developer. It's a normal codebase from the moment it's on your disk.</p>`,
  },
];

/* ------------------------------ rendering ------------------------------ */

const DOCS_CSS = `
.docwrap{display:grid;grid-template-columns:220px 1fr;gap:34px;align-items:start;padding-top:26px}
@media(max-width:900px){.docwrap{grid-template-columns:1fr;gap:10px}}
aside.docs{position:sticky;top:70px;background:#fff;border:1px solid #e2ede6;border-radius:14px;padding:14px}
@media(max-width:900px){aside.docs{position:static}}
aside.docs h4{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#5b7466}
aside.docs a{display:block;padding:6px 8px;border-radius:8px;text-decoration:none;color:#33523f;font-size:14px}
aside.docs a:hover{background:#eaf6ee}
aside.docs a.cur{background:#eaf6ee;color:#0b2818;font-weight:700}
article.doc{min-width:0}
article.doc h1{margin-top:0}
article.doc pre{background:#0b2818;color:#c9f3da;padding:14px 16px;border-radius:12px;overflow-x:auto;font-size:13.5px;line-height:1.55}
article.doc code{background:#e7f3ec;border-radius:5px;padding:1px 5px;font-size:.92em}
article.doc pre code{background:none;padding:0}
article.doc .card h3 a{text-decoration:none;color:#0b2818}
.prevnext{display:flex;justify-content:space-between;gap:12px;margin:38px 0 8px;flex-wrap:wrap}
.prevnext a{background:#fff;border:1px solid #e2ede6;border-radius:12px;padding:10px 16px;text-decoration:none;color:#0e7a4b;font-weight:700;font-size:14px}
`;

const docPath = (d) => (d.slug ? `/docs/${d.slug}` : "/docs");

function renderDoc(doc) {
  const url = `${CANONICAL}${docPath(doc)}`;
  const i = DOCS.indexOf(doc);
  const prev = DOCS[i - 1], next = DOCS[i + 1];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: doc.h1,
      description: doc.desc,
      url,
      author: { "@type": "Organization", name: "FlowBot", url: `${CANONICAL}/` },
      publisher: { "@type": "Organization", name: "FlowBot", url: `${CANONICAL}/` },
      dateModified: seo.LASTMOD || undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "FlowBot", item: `${CANONICAL}/` },
        { "@type": "ListItem", position: 2, name: "Docs", item: `${CANONICAL}/docs` },
        ...(doc.slug ? [{ "@type": "ListItem", position: 3, name: doc.navLabel, item: url }] : []),
      ],
    },
  ];

  const sidebar = DOCS.map(
    (d) => `<a href="${docPath(d)}"${d === doc ? ' class="cur" aria-current="page"' : ""}>${esc(d.navLabel)}</a>`
  ).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title)}</title>
<meta name="description" content="${esc(doc.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#25D366">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="FlowBot">
<meta property="og:title" content="${esc(doc.title)}">
<meta property="og:description" content="${esc(doc.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${CANONICAL}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(doc.title)}">
<meta name="twitter:description" content="${esc(doc.desc)}">
<meta name="twitter:image" content="${CANONICAL}/og-image.png">
${jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
<style>${seo.CSS}${DOCS_CSS}</style>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="logo" href="/">${seo.LOGO_SVG} FlowBot</a>
  ${seo.NAV}
</div></header>
<main class="wrap">
  <div class="docwrap">
    <aside class="docs" aria-label="Docs navigation">
      <h4><a href="/docs" style="padding:0;display:inline;color:inherit">📚 Docs</a></h4>
      ${sidebar}
    </aside>
    <article class="doc">
      <h1>${esc(doc.h1)}</h1>
      ${doc.body}
      <div class="prevnext">
        ${prev ? `<a href="${docPath(prev)}">← ${esc(prev.navLabel)}</a>` : "<span></span>"}
        ${next ? `<a href="${docPath(next)}">${esc(next.navLabel)} →</a>` : "<span></span>"}
      </div>
    </article>
  </div>
</main>
${seo.FOOTER}
</body>
</html>`;
}

/* what sitemap.xml / llms.txt need to know about the docs */
const entries = DOCS.map((d) => ({
  path: docPath(d),
  title: d.title,
  desc: d.desc,
  priority: d.slug ? "0.7" : "0.8",
  changefreq: "monthly",
}));

module.exports = { DOCS, renderDoc, docPath, entries };
