/* ============================================================
   Ready-made bot templates — realistic, fully wired flows
   (15+ blocks each) that work in the simulator and live bots.
   Coordinates are laid out on a simple column/row grid.
   ============================================================ */

const at = (col, row) => ({ x: 40 + col * 310, y: 40 + row * 130 });
const N = (id, type, col, row, config) => ({ id, type, ...at(col, row), config });
const E = (from, fromPort, to) => ({ id: `${from}-${fromPort}-${to}`, from, fromPort, to });

/* ---------------- 🍽️ Spice Villa — Restaurant ---------------- */
const restaurant = {
  name: "Spice Villa Restaurant",
  emoji: "🍽️",
  desc: "Table booking, food orders, menu & offers, location, staff handoff — 20 blocks.",
  nodes: () => [
    N("w", "welcome", 0, 2, { message: "🍛 Welcome to Spice Villa! I'm your dining assistant — bookings, orders and more, right here on WhatsApp." }),
    N("bh", "business_hours", 1, 2, { startHour: 11, endHour: 23, openMessage: "🟢 We're open right now (11 AM – 11 PM).", closedMessage: "" }),
    N("closed", "text", 2, 0, { message: "🌙 We're closed at the moment (open 11 AM – 11 PM), but you can still book a table or browse the menu!" }),
    N("m", "menu", 2, 2, { prompt: "How can I serve you today?", options: ["Book a table", "Order food", "Menu & offers", "Location & timings", "Talk to our staff"] }),
    // — Book a table —
    N("bkname", "collect", 3, 0, { question: "Lovely! What name should I book the table under?", field: "name" }),
    N("bkphone", "collect_phone", 4, 0, { question: "And your phone number, {name}?", ack: "Got it 👍" }),
    N("bkguests", "collect", 5, 0, { question: "How many guests should I expect?", field: "guests" }),
    N("appt", "appointment", 6, 0, { question: "Which date & time would you like? (e.g. 25 Dec, 8 PM)", ack: "One moment…" }),
    N("confirm", "booking_confirm", 7, 1, { message: "🎉 Done! Table for {guests} booked under {name} for {appointmentTime}. We'll hold it for 15 minutes past the hour." }),
    // — Order food —
    N("cat", "catalog", 3, 2, { title: "👨‍🍳 Today's specials", items: [
      { name: "Butter Chicken + Naan", price: "₹349" },
      { name: "Paneer Tikka Masala", price: "₹299" },
      { name: "Hyderabadi Biryani", price: "₹329" },
      { name: "Dal Makhani + Rice", price: "₹249" },
      { name: "Gulab Jamun (2 pc)", price: "₹99" },
    ] }),
    N("order", "collect", 4, 2, { question: "Type the dishes you'd like to order (e.g. 1 Biryani, 2 Naan):", field: "order" }),
    N("addr", "collect_address", 5, 2, { question: "Where should we deliver? Please share your full address:", ack: "📍 Address saved." }),
    N("pay", "payment_link", 6, 2, { message: "🧾 Order noted: {order}\nPay securely here and we'll start cooking:", url: "https://rzp.io/l/spicevilla-pay" }),
    // — Menu & offers —
    N("menucard", "link", 3, 4, { message: "📜 Our full menu card:", url: "https://spicevilla.example.com/menu.pdf" }),
    N("coup", "coupon", 4, 4, { message: "🎁 Weekday special — 10% off on orders above ₹499:", code: "TASTY10" }),
    // — Location —
    N("loc", "text", 3, 5.5, { message: "📍 Spice Villa, 12 MG Road, Pune 411001\n🕚 Open daily 11 AM – 11 PM\n📞 +91 98765 43210" }),
    N("map", "link", 4, 5.5, { message: "🗺️ Find us on Google Maps:", url: "https://maps.google.com/?q=Spice+Villa+MG+Road+Pune" }),
    // — Staff + wrap-up —
    N("staff", "human_handoff", 3, 7, { message: "🙋 Connecting you to our team — someone will reply here within a few minutes." }),
    N("csat", "csat", 7, 3, { question: "Before you go — rate your experience with me (1–5):", field: "rating", thanks: "Thanks for the {rating}/5! 🙏" }),
    N("bye", "goodbye", 8, 3, { message: "Thank you for choosing Spice Villa! 🌶️ Send any message to start again." }),
  ],
  edges: () => [
    E("w", 0, "bh"),
    E("bh", 0, "m"), E("bh", 1, "closed"), E("closed", 0, "m"),
    E("m", 0, "bkname"), E("bkname", 0, "bkphone"), E("bkphone", 0, "bkguests"),
    E("bkguests", 0, "appt"), E("appt", 0, "confirm"), E("confirm", 0, "csat"),
    E("m", 1, "cat"), E("cat", 0, "order"), E("order", 0, "addr"), E("addr", 0, "pay"), E("pay", 0, "csat"),
    E("m", 2, "menucard"), E("menucard", 0, "coup"), E("coup", 0, "bye"),
    E("m", 3, "loc"), E("loc", 0, "map"), E("map", 0, "bye"),
    E("m", 4, "staff"), E("staff", 0, "bye"),
    E("csat", 0, "bye"),
  ],
};

/* ---------------- 🏦 SafeBank — Bank support ---------------- */
const bank = {
  name: "SafeBank Assistant",
  emoji: "🏦",
  desc: "Account services, card block, loan leads, branch info, FAQ, agent handoff — 19 blocks.",
  nodes: () => [
    N("w", "welcome", 0, 2, { message: "🏦 Welcome to SafeBank! I'm your 24×7 virtual assistant. I never ask for OTPs, PINs or passwords." }),
    N("lang", "language", 1, 2, { prompt: "Choose your language / भाषा चुनें:", options: ["English", "हिन्दी"] }),
    N("m", "menu", 2, 2, { prompt: "How can I help you today?", options: ["Account services", "Cards", "Loans", "Branch & timings", "FAQs", "Talk to an agent"] }),
    // — Account services —
    N("acct", "menu", 3, 0, { prompt: "Account services:", options: ["Check balance", "Mini statement", "Update details"] }),
    N("bal", "collect", 4, 0, { question: "🔐 For verification, share the LAST 4 digits of your account number:", field: "acct4" }),
    N("baltxt", "text", 5, 0, { message: "✅ Verified account ••••{acct4}. Your balance and mini statement have been sent by SMS to your registered mobile number." }),
    // — Cards —
    N("cards", "quick_reply", 3, 2, { prompt: "Card services:", options: ["🚫 Block my card", "💳 Apply for a new card"] }),
    N("blockc", "collect", 4, 2, { question: "⚠️ Share the LAST 4 digits of the card to block:", field: "card4" }),
    N("blocked", "text", 5, 2, { message: "🚫 Card ending ••••{card4} has been blocked immediately. Reference: SB-{card4}-BLK. A replacement card reaches you in 5–7 working days." }),
    N("applylink", "link", 4, 3.2, { message: "💳 Compare and apply for credit & debit cards here:", url: "https://safebank.example.com/cards" }),
    // — Loans —
    N("loans", "lead_qualify", 3, 4.5, { prompt: "Which loan are you interested in?", options: ["🏠 Home loan @ 8.4%", "🚗 Car loan @ 9.1%", "👤 Personal loan @ 11.5%"] }),
    N("lphone", "collect_phone", 4, 4.5, { question: "Great choice! Share your phone number and our loan officer will call you within 24 hours:", ack: "📞 Number saved." }),
    N("ltag", "tag_customer", 5, 4.5, { tag: "loan_lead", message: "📝 You're registered for: {lead_qualify_choice}. Our officer will call you shortly." }),
    // — Branch, FAQs, agent —
    N("branch", "business_hours", 3, 6, { startHour: 9, endHour: 17, openMessage: "🟢 Branches are open right now (Mon–Sat, 9 AM – 5 PM).", closedMessage: "🔴 Branches are closed now (Mon–Sat, 9 AM – 5 PM)." }),
    N("baddr", "text", 4, 6, { message: "🏢 Nearest branch: SafeBank, 45 FC Road, Pune 411004\nIFSC: SAFE0000123 · ATM available 24×7" }),
    N("faqs", "faq", 3, 7.5, { pairs: [
      { k: "interest", a: "Savings account interest is 4% p.a., credited quarterly." },
      { k: "ifsc", a: "Our IFSC code is SAFE0000123 (FC Road branch)." },
      { k: "minimum", a: "Minimum balance is ₹2,000 for savings accounts (zero for salary accounts)." },
      { k: "netbanking", a: "Register for netbanking at safebank.example.com/register with your debit card." },
    ] }),
    N("agent", "human_handoff", 3, 9, { message: "🙋 Connecting you to a SafeBank agent. Average wait time: under 5 minutes." }),
    N("csat", "csat", 6, 2, { question: "How was my help today? Rate 1–5:", field: "rating", thanks: "Thank you for the {rating}/5! 🙏" }),
    N("bye", "goodbye", 7, 2, { message: "Thanks for banking with SafeBank! 🏦 Stay alert: we NEVER call to ask for OTP or PIN. Send any message to start again." }),
  ],
  edges: () => [
    E("w", 0, "lang"), E("lang", 0, "m"), E("lang", 1, "m"),
    E("m", 0, "acct"), E("acct", 0, "bal"), E("acct", 1, "bal"), E("acct", 2, "agent"),
    E("bal", 0, "baltxt"), E("baltxt", 0, "csat"),
    E("m", 1, "cards"), E("cards", 0, "blockc"), E("blockc", 0, "blocked"), E("blocked", 0, "csat"),
    E("cards", 1, "applylink"), E("applylink", 0, "bye"),
    E("m", 2, "loans"), E("loans", 0, "lphone"), E("loans", 1, "lphone"), E("loans", 2, "lphone"),
    E("lphone", 0, "ltag"), E("ltag", 0, "bye"),
    E("m", 3, "branch"), E("branch", 0, "baddr"), E("branch", 1, "baddr"), E("baddr", 0, "bye"),
    E("m", 4, "faqs"), E("faqs", 0, "csat"),
    E("m", 5, "agent"), E("agent", 0, "bye"),
    E("csat", 0, "bye"),
  ],
};

/* ---------------- ♟️ GrandMaster Academy — Chess coach ---------------- */
const chess = {
  name: "GrandMaster Chess Academy",
  emoji: "♟️",
  desc: "Trial lessons by level, courses & payment, daily puzzle, FAQ — 17 blocks.",
  nodes: () => [
    N("w", "welcome", 0, 2, { message: "♟️ Namaste! I'm the assistant of FM Arjun Rao (FIDE 2350). I handle trial lessons, courses and daily puzzles for the academy." }),
    N("m", "menu", 1, 2, { prompt: "What would you like to do?", options: ["Book a FREE trial lesson", "Courses & pricing", "Today's puzzle", "Ask a question", "Contact the coach"] }),
    // — Trial lesson —
    N("level", "lead_qualify", 2, 0, { prompt: "What's your current level?", options: ["Beginner (unrated / <1000)", "Intermediate (1000–1600)", "Advanced (1600+)"] }),
    N("lname", "collect", 3, 0, { question: "Great! What's the student's name?", field: "name" }),
    N("lemail", "collect_email", 4, 0, { question: "Which email should I send the meeting link to?", ack: "📧 Saved." }),
    N("sched", "appointment", 5, 0, { question: "Which day & time works for the 30-min trial? (Mon–Sat, 4–9 PM IST)", ack: "Checking the coach's calendar…" }),
    N("bconfirm", "booking_confirm", 6, 0, { message: "✅ Trial booked! {name} · {lead_qualify_choice} · {appointmentTime}. The Google Meet link is on its way to {email}. 🎯" }),
    // — Courses —
    N("courses", "catalog", 2, 2, { title: "📚 Academy courses (live, online)", items: [
      { name: "Pawn to Queen — Beginner batch (12 classes)", price: "₹3,999" },
      { name: "Tactics Bootcamp — Intermediate (8 classes)", price: "₹4,999" },
      { name: "Master Endgames — Advanced (10 classes)", price: "₹7,499" },
      { name: "1-on-1 with FM Arjun (per hour)", price: "₹1,500" },
    ] }),
    N("ccoup", "coupon", 3, 2, { message: "🎁 New student offer — 20% off your first course:", code: "CHESS20" }),
    N("cpay", "payment_link", 4, 2, { message: "Enroll now — pay securely here:", url: "https://rzp.io/l/gm-academy" }),
    // — Puzzle —
    N("puzzle", "image", 2, 4, { caption: "🧩 Daily puzzle — White to move and mate in 2. Think before you peek!", url: "https://lichess.org/training/daily" }),
    N("pshow", "quick_reply", 3, 4, { prompt: "Ready?", options: ["Show the solution", "I'll solve it myself 💪"] }),
    N("sol", "text", 4, 4, { message: "♛ Solution: 1. Qh7+!! Kxh7 2. Rh3# — the classic queen sacrifice. Want more? Book a trial lesson!" }),
    // — FAQ + contact —
    N("faqs", "faq", 2, 5.7, { pairs: [
      { k: "age", a: "We coach students from age 5 to adults — batches are grouped by level, not age." },
      { k: "online", a: "All classes are live on Google Meet with an interactive board (Lichess)." },
      { k: "fees", a: "Group courses start at ₹3,999. 1-on-1 with the coach is ₹1,500/hour." },
      { k: "timing", a: "Classes run Mon–Sat between 4 PM and 9 PM IST." },
    ] }),
    N("coach", "human_handoff", 2, 7.2, { message: "🙋 I've pinged Coach Arjun — he replies personally between games, usually within a few hours." }),
    N("csat", "csat", 6, 2.5, { question: "Rate your experience with the academy bot (1–5):", field: "rating", thanks: "Thanks for the {rating}/5! ♟️" }),
    N("bye", "goodbye", 7, 2.5, { message: "Thanks for visiting GrandMaster Academy! Keep calm and play the Sicilian. ♟️ Send any message to start again." }),
  ],
  edges: () => [
    E("w", 0, "m"),
    E("m", 0, "level"), E("level", 0, "lname"), E("level", 1, "lname"), E("level", 2, "lname"),
    E("lname", 0, "lemail"), E("lemail", 0, "sched"), E("sched", 0, "bconfirm"), E("bconfirm", 0, "csat"),
    E("m", 1, "courses"), E("courses", 0, "ccoup"), E("ccoup", 0, "cpay"), E("cpay", 0, "bye"),
    E("m", 2, "puzzle"), E("puzzle", 0, "pshow"), E("pshow", 0, "sol"), E("pshow", 1, "bye"), E("sol", 0, "csat"),
    E("m", 3, "faqs"), E("faqs", 0, "bye"),
    E("m", 4, "coach"), E("coach", 0, "bye"),
    E("csat", 0, "bye"),
  ],
};

/* ---------------- 🛍️ TrendKart — Online store ---------------- */
const store = {
  name: "TrendKart Online Store",
  emoji: "🛍️",
  desc: "Catalog, product search, order tracking, returns, offers, support — 19 blocks.",
  nodes: () => [
    N("w", "welcome", 0, 2, { message: "🛍️ Hey! Welcome to TrendKart — fashion & accessories delivered across India. I can help you shop, track and more." }),
    N("m", "menu", 1, 2, { prompt: "What are you looking for today?", options: ["Browse bestsellers", "Search a product", "Track my order", "Returns & shipping", "Offers", "Customer support"] }),
    // — Browse & buy —
    N("cat", "catalog", 2, 0, { title: "🔥 This week's bestsellers", items: [
      { name: "Oversized Graphic Tee", price: "₹699" },
      { name: "Classic White Sneakers", price: "₹1,999" },
      { name: "Denim Jacket — Indigo", price: "₹2,499" },
      { name: "Canvas Tote Bag", price: "₹499" },
    ] }),
    N("pcard", "product_card", 3, 0, { name: "⭐ Deal of the day: Classic White Sneakers", price: "₹1,999 ₹1,499", description: "Cushioned sole, all-day comfort. Sizes UK 6–11. 4.6★ (2,300 reviews).", link: "https://trendkart.example.com/p/sneakers" }),
    N("buy", "quick_reply", 4, 0, { prompt: "Like it?", options: ["🛒 Buy now", "↩️ Back to menu"] }),
    N("tag", "tag_customer", 5, 0, { tag: "hot_lead", message: "🔖 Reserved for you for 30 minutes!" }),
    N("pay", "payment_link", 6, 0, { message: "Complete your purchase securely:", url: "https://rzp.io/l/trendkart-checkout" }),
    N("review", "review_request", 7, 0.5, { message: "💚 Loved shopping with us? A quick review helps a lot: https://trendkart.example.com/review" }),
    // — Search —
    N("search", "product_search", 2, 2.2, { question: "🔎 What are you looking for? (e.g. shoes, jacket, bag)", notFound: "Hmm, couldn't find that. Try 'tee', 'sneakers', 'jacket' or 'bag'.", items: [
      { name: "Oversized Graphic Tee", keywords: "tshirt tee top shirt", price: "₹699", description: "100% cotton, unisex fit.", link: "https://trendkart.example.com/p/tee" },
      { name: "Classic White Sneakers", keywords: "shoes sneaker footwear", price: "₹1,999", description: "Cushioned sole, UK 6–11.", link: "https://trendkart.example.com/p/sneakers" },
      { name: "Denim Jacket — Indigo", keywords: "jacket denim winter", price: "₹2,499", description: "Heavy-wash denim, S–XXL.", link: "https://trendkart.example.com/p/jacket" },
      { name: "Canvas Tote Bag", keywords: "bag tote carry", price: "₹499", description: "Fits a 15\" laptop.", link: "https://trendkart.example.com/p/tote" },
    ] }),
    N("nf", "text", 3, 3.4, { message: "You can also browse the full store here: https://trendkart.example.com" }),
    // — Track order —
    N("ostat", "order_status", 2, 4.6, { question: "📦 Please share your order ID (e.g. TK12345):", ack: "Found it! Order {orderId} is packed and on the way." }),
    N("track", "tracking_link", 3, 4.6, { question: "Want live tracking? Share the AWB number from your shipping SMS:", baseUrl: "https://trendkart.example.com/track/", ack: "🚚 Live tracking: {baseUrl}{trackingId}" }),
    // — Returns & shipping —
    N("retn", "return_policy", 2, 6, { message: "↩️ Easy returns: 7-day no-questions-asked returns on unworn items with tags. Refund in 3–5 days to source." }),
    N("ship", "shipping_info", 3, 6, { message: "📮 Free shipping above ₹999 (else ₹79). Metro delivery 2–3 days, rest of India 4–6 days. COD available." }),
    // — Offers, support —
    N("coup", "coupon", 2, 7.3, { message: "🎉 Festive sale is LIVE — extra 15% off everything:", code: "TREND15" }),
    N("faqs", "faq", 2, 8.6, { pairs: [
      { k: "size", a: "Size charts are on every product page. Between sizes? Go one up — easy exchanges anyway!" },
      { k: "cod", a: "Yes, Cash on Delivery is available on orders up to ₹5,000 (₹49 COD fee)." },
      { k: "cancel", a: "Orders can be cancelled free of charge until they're shipped — usually within 12 hours." },
      { k: "refund", a: "Refunds reach your account in 3–5 working days after pickup." },
    ] }),
    N("agent", "human_handoff", 3, 8.6, { message: "🙋 Connecting you to TrendKart support (10 AM – 7 PM). A teammate will reply right here." }),
    N("csat", "csat", 6, 3, { question: "Rate your TrendKart chat experience (1–5):", field: "rating", thanks: "Thanks a bunch — {rating}/5 noted! 🧡" }),
    N("bye", "goodbye", 7, 3, { message: "Happy shopping with TrendKart! 🛍️ Send any message to start again." }),
  ],
  edges: () => [
    E("w", 0, "m"),
    E("m", 0, "cat"), E("cat", 0, "pcard"), E("pcard", 0, "buy"),
    E("buy", 0, "tag"), E("tag", 0, "pay"), E("pay", 0, "review"), E("review", 0, "csat"),
    E("buy", 1, "m"),
    E("m", 1, "search"), E("search", 0, "buy"), E("search", 1, "nf"), E("nf", 0, "m"),
    E("m", 2, "ostat"), E("ostat", 0, "track"), E("track", 0, "csat"),
    E("m", 3, "retn"), E("retn", 0, "ship"), E("ship", 0, "bye"),
    E("m", 4, "coup"), E("coup", 0, "cat"),
    E("m", 5, "faqs"), E("faqs", 0, "agent"), E("agent", 0, "csat"),
    E("csat", 0, "bye"),
  ],
};

/* ---------------- 🏨 Hotel Paradise — Hyderabad (78 blocks) ---------------- */
const hotel = {
  name: "Hotel Paradise Hyderabad",
  emoji: "🏨",
  desc: "Full concierge: rooms, dining & room service, spa, banquets, airport transfer, bookings, info desk — 77 blocks.",
  nodes: () => [
    /* — reception core — */
    N("w", "welcome", 0, 8, { message: "🏨 Namaste! Welcome to Hotel Paradise, Banjara Hills, Hyderabad ⭐⭐⭐⭐⭐\nI'm Pari, your 24×7 digital concierge." }),
    N("lang", "language", 1, 8, { prompt: "Choose your language / भाषा चुनें / భాష ఎంచుకోండి:", options: ["English", "हिन्दी", "తెలుగు"] }),
    N("m", "menu", 2, 8, { prompt: "How may I assist you today?", options: [
      "🛏️ Book a room", "🍽️ Dining & room service", "💆 Spa & wellness", "💒 Banquets & events",
      "🚖 Airport transfer", "📂 My booking", "ℹ️ Hotel info & FAQs", "🙋 Talk to reception",
    ] }),

    /* — 1. rooms — */
    N("rmenu", "menu", 4, 0, { prompt: "Our rooms (all include breakfast + WiFi):", options: [
      "🛏️ Deluxe Room — ₹6,999/night", "🛋️ Executive Suite — ₹11,999/night", "👑 Presidential Suite — ₹24,999/night", "📋 Compare all rooms",
    ] }),
    N("rc1", "product_card", 5.2, 0, { name: "🛏️ Deluxe Room", price: "₹6,999/night", description: "32 m² · king bed · city view · rain shower · 43\" TV. Fits 2 adults + 1 child.", link: "https://hotelparadise.example.com/rooms/deluxe" }),
    N("rc2", "product_card", 5.2, 1.3, { name: "🛋️ Executive Suite", price: "₹11,999/night", description: "58 m² · separate living room · lake view · bathtub · lounge access. Fits 3 adults.", link: "https://hotelparadise.example.com/rooms/executive" }),
    N("rc3", "product_card", 5.2, 2.6, { name: "👑 Presidential Suite", price: "₹24,999/night", description: "120 m² · 2 bedrooms · private terrace · butler service · jacuzzi.", link: "https://hotelparadise.example.com/rooms/presidential" }),
    N("rcat", "catalog", 5.2, 3.9, { title: "📋 All rooms at a glance", items: [
      { name: "Deluxe Room · 32 m² · 2+1 guests", price: "₹6,999" },
      { name: "Executive Suite · 58 m² · 3 guests", price: "₹11,999" },
      { name: "Presidential Suite · 120 m² · 4 guests", price: "₹24,999" },
    ] }),
    N("rbuy", "quick_reply", 6.5, 1.3, { prompt: "Shall I reserve it?", options: ["✅ Book this room", "🔙 See other rooms"] }),
    N("bname", "collect", 7.7, 0, { question: "Wonderful choice! What name should the reservation be under?", field: "name" }),
    N("bphone", "collect_phone", 8.9, 0, { question: "Your phone number, {name}?", ack: "📞 Saved." }),
    N("bemail", "collect_email", 10.1, 0, { question: "And an email for the confirmation voucher?", ack: "📧 Saved." }),
    N("bdate", "appointment", 11.3, 0, { question: "Check-in date & number of nights? (e.g. 24 Dec, 2 nights)", ack: "🗓️ Noted." }),
    N("bguests", "collect_number", 12.5, 0, { question: "How many guests will be staying?", field: "guests", ack: "Got it — {guests} guest(s)." }),
    N("bnote", "save_note", 7.7, 1.5, { field: "roomChoice", note: "{menu_choice}", message: "" }),
    N("btag", "tag_customer", 8.9, 1.5, { tag: "room_booking", message: "" }),
    N("bconfirm", "booking_confirm", 10.1, 1.5, { message: "🎉 Reserved! {roomChoice}\n👤 {name} · {guests} guest(s)\n🗓️ {appointmentTime}\nVoucher heading to {email}." }),
    N("bpay", "payment_link", 11.3, 1.5, { message: "Secure it with a ₹2,000 advance (adjusted at checkout):", url: "https://rzp.io/l/hotelparadise-advance" }),
    N("bcoup", "coupon", 12.5, 1.5, { message: "🎁 Direct-booking bonus — 10% off dining during your stay:", code: "WELCOME10" }),

    /* — 2. dining & room service — */
    N("dmenu", "menu", 4, 5.5, { prompt: "🍽️ Dining at Paradise:", options: [
      "Book a restaurant table", "Order room service", "Today's specials & offers", "Dining venues & timings",
    ] }),
    N("dtname", "collect", 5.2, 5.5, { question: "Which name should the table be under?", field: "name" }),
    N("dtguests", "collect_number", 6.4, 5.5, { question: "For how many people?", field: "tableGuests", ack: "👥 Table for {tableGuests}." }),
    N("dttime", "appointment", 7.6, 5.5, { question: "Date & time? (e.g. tonight 8 PM)", ack: "🗓️ Checking availability…" }),
    N("dtconf", "booking_confirm", 8.8, 5.5, { message: "✅ Table for {tableGuests} under {name} at {appointmentTime} — Jewel of Nizam rooftop. Dress code: smart casual." }),
    N("rsroom", "collect_number", 5.2, 6.8, { question: "🛎️ Room service! Which room number are you in?", field: "roomNo", ack: "Room {roomNo} ✔️" }),
    N("rscat", "catalog", 6.4, 6.8, { title: "In-room dining (24×7)", items: [
      { name: "Hyderabadi Dum Biryani", price: "₹549" },
      { name: "Paneer Butter Masala + Naan", price: "₹449" },
      { name: "Club Sandwich + Fries", price: "₹349" },
      { name: "Double Ka Meetha", price: "₹199" },
      { name: "Masala Chai Pot", price: "₹149" },
    ] }),
    N("rsorder", "collect", 7.6, 6.8, { question: "What would you like? (e.g. 1 Biryani + chai)", field: "order" }),
    N("rsnote", "save_note", 8.8, 6.8, { field: "orderNote", note: "Room {roomNo}: {order}", message: "" }),
    N("rsconf", "text", 10, 6.8, { message: "🛎️ Order confirmed: {order}\n🚪 Room {roomNo} · arrives in ~35 minutes. Bon appétit!" }),
    N("dspec", "catalog", 5.2, 8.4, { title: "👨‍🍳 Today's chef specials", items: [
      { name: "Haleem (seasonal special)", price: "₹399" },
      { name: "Patthar ka Gosht", price: "₹649" },
      { name: "Qubani ka Meetha", price: "₹249" },
    ] }),
    N("dcoup", "coupon", 6.4, 8.4, { message: "🥂 Happy hours 4–7 PM — flat 20% off F&B:", code: "DINE20" }),
    N("dhours", "business_hours", 5.2, 9.9, { startHour: 7, endHour: 23, openMessage: "🟢 Our restaurants are serving right now!", closedMessage: "🔴 Kitchens are closed (7 AM – 11 PM) — but room service runs 24×7." }),
    N("dvenues", "text", 6.4, 9.9, { message: "🍽️ Venues:\n• Jewel of Nizam (rooftop, 12–11 PM)\n• Café Charminar (all-day, 7 AM–11 PM)\n• Aqua Bar (poolside, 4 PM–12 AM)\n• In-room dining 24×7" }),

    /* — 3. spa & wellness — */
    N("simg", "image", 4, 11.5, { caption: "💆 Paradise Spa — Kerala ayurveda, deep-tissue & couples therapies:", url: "https://hotelparadise.example.com/img/spa.jpg" }),
    N("scat", "catalog", 5.2, 11.5, { title: "Spa menu (60–90 min)", items: [
      { name: "Abhyanga Ayurvedic Massage", price: "₹3,500" },
      { name: "Deep Tissue Massage", price: "₹4,000" },
      { name: "Couples Suite Ritual", price: "₹7,999" },
      { name: "Head & Shoulder Express (30 min)", price: "₹1,500" },
    ] }),
    N("squick", "quick_reply", 6.4, 11.5, { prompt: "Book a session?", options: ["💆 Yes, book me in", "🔙 Main menu"] }),
    N("sname", "collect", 7.6, 11.5, { question: "Name for the spa appointment?", field: "name" }),
    N("stime", "appointment", 8.8, 11.5, { question: "Preferred date & time? (spa open 8 AM – 9 PM)", ack: "🧘 Checking the therapist roster…" }),
    N("sconf", "booking_confirm", 10, 11.5, { message: "💆 Spa session for {name} at {appointmentTime} is blocked. Please arrive 15 min early." }),
    N("scoup", "coupon", 11.2, 11.5, { message: "🌸 Weekday mornings — 15% off all therapies:", code: "SPA15" }),
    N("stag", "tag_customer", 12.4, 11.5, { tag: "spa_booking", message: "" }),

    /* — 4. banquets & events — */
    N("elead", "lead_qualify", 4, 13.2, { prompt: "What are you celebrating?", options: ["💒 Wedding", "🏢 Corporate event", "🎂 Birthday / private party"] }),
    N("ecat", "catalog", 5.2, 13.2, { title: "🏛️ Our venues", items: [
      { name: "Nizam Grand Ballroom · up to 800 guests", price: "from ₹3.5L" },
      { name: "Pearl Lawn (outdoor) · up to 400", price: "from ₹2L" },
      { name: "Boardroom Charminar · up to 40", price: "from ₹25k" },
    ] }),
    N("edate", "appointment", 6.4, 13.2, { question: "Tentative event date?", ack: "🗓️ Noted." }),
    N("eguests", "collect_number", 7.6, 13.2, { question: "Expected number of guests?", field: "eventGuests", ack: "👥 Planning for {eventGuests}." }),
    N("ephone", "collect_phone", 8.8, 13.2, { question: "Best number for our events team to call you on?", ack: "📞 Saved." }),
    N("enote", "save_note", 10, 13.2, { field: "eventNote", note: "{lead_qualify_choice} · {eventGuests} pax · {appointmentTime}", message: "" }),
    N("etag", "tag_customer", 11.2, 13.2, { tag: "event_lead", message: "" }),
    N("ebroch", "link", 12.4, 13.2, { message: "📖 Meanwhile, our banquet brochure & menus:", url: "https://hotelparadise.example.com/banquets.pdf" }),
    N("ehand", "human_handoff", 13.6, 13.2, { message: "🤝 Our events manager Ayesha will call you within 2 hours with a tailored quote for your {lead_qualify_choice}." }),

    /* — 5. airport transfer — */
    N("atext", "text", 4, 15, { message: "🚖 Airport transfers (RGIA ↔ hotel, 45 min):\n• Sedan — ₹1,200\n• Innova — ₹1,800\n• BMW 5-series — ₹4,500\nAll include meet & greet + water." }),
    N("aq", "quick_reply", 5.2, 15, { prompt: "Which way?", options: ["🛬 Airport → Hotel pickup", "🛫 Hotel → Airport drop"] }),
    N("aflight", "collect", 6.4, 15, { question: "Flight number please? (e.g. 6E 342)", field: "flight" }),
    N("atime", "appointment", 7.6, 15, { question: "Pickup date & time?", ack: "🗓️ Noted." }),
    N("aname", "collect", 8.8, 15, { question: "Passenger name for the placard?", field: "name" }),
    N("anote", "save_note", 10, 15, { field: "transferNote", note: "{quick_reply_choice} · flight {flight} · {appointmentTime}", message: "" }),
    N("aconf", "booking_confirm", 11.2, 15, { message: "🚖 Transfer booked!\n👤 {name} · ✈️ {flight}\n🗓️ {appointmentTime}\nChauffeur details come by SMS 2 hrs before." }),
    N("apay", "payment_link", 12.4, 15, { message: "Pay now or at the hotel — your choice:", url: "https://rzp.io/l/hotelparadise-transfer" }),

    /* — 6. my booking — */
    N("bkid", "order_status", 4, 16.8, { question: "📂 Please share your booking ID (e.g. HP-10234):", ack: "🔎 Found booking {orderId}." }),
    N("bkstat", "text", 5.2, 16.8, { message: "✅ Booking {orderId}: CONFIRMED\nDeluxe Room · 24–26 Dec · 2 guests · breakfast included (demo data)." }),
    N("bkmod", "quick_reply", 6.4, 16.8, { prompt: "Anything to change?", options: ["✏️ Modify booking", "❌ Cancel booking", "👍 All good"] }),
    N("bkhand", "human_handoff", 7.6, 16, { message: "✏️ Connecting you to reservations to modify {orderId} — one moment." }),
    N("bkreason", "collect", 7.6, 17.2, { question: "Sorry to see that! May I know the reason for cancelling?", field: "cancelReason" }),
    N("bkcanc", "text", 8.8, 17.2, { message: "❌ Cancellation for {orderId} is registered (\"{cancelReason}\"). Free cancellation till 48 hrs before check-in — refund in 5–7 days." }),
    N("bkok", "text", 7.6, 18.4, { message: "🥳 Great! We look forward to hosting you. Need anything before arrival, just message me." }),

    /* — 7. hotel info & FAQs — */
    N("imenu", "menu", 4, 20.4, { prompt: "ℹ️ Hotel Paradise info desk:", options: [
      "📍 Location & directions", "🏊 Facilities", "🖼️ Photo gallery", "🕑 Check-in / check-out", "☎️ Contact us", "❓ FAQs",
    ] }),
    N("iloc", "location", 5.4, 19.2, { title: "Hotel Paradise, Hyderabad", address: "Road No. 2, Banjara Hills, Hyderabad 500034\n(25 min from HITEC City · 45 min from RGIA airport)", mapsUrl: "https://maps.google.com/?q=Hotel+Paradise+Banjara+Hills+Hyderabad" }),
    N("ifac", "catalog", 5.4, 20.6, { title: "🏊 Facilities (all included)", items: [
      { name: "Infinity rooftop pool (6 AM–10 PM)", price: "" },
      { name: "24×7 gym & yoga deck", price: "" },
      { name: "Paradise Spa", price: "" },
      { name: "Kids' play zone & crèche", price: "" },
      { name: "Business centre & 5 meeting rooms", price: "" },
      { name: "Valet parking (complimentary)", price: "" },
    ] }),
    N("iimg", "image", 5.4, 22.6, { caption: "🖼️ A peek inside Hotel Paradise:", url: "https://hotelparadise.example.com/img/gallery.jpg" }),
    N("itimes", "text", 5.4, 23.9, { message: "🕑 Check-in: 2 PM · Check-out: 12 noon\nEarly check-in / late check-out subject to availability (₹1,500 per 3 hrs)." }),
    N("ipol", "return_policy", 6.6, 23.9, { message: "📋 Cancellation policy: free till 48 hrs before check-in; within 48 hrs, one night is charged. No-show: full first night." }),
    N("icontact", "contact_card", 5.4, 25.2, { title: "Hotel Paradise — front desk (24×7)", phone: "+91 40 6789 0000", email: "stay@hotelparadise.example.com", website: "https://hotelparadise.example.com" }),
    N("ifaq", "faq", 5.4, 26.5, { pairs: [
      { k: "wifi", a: "High-speed WiFi is free across the hotel — network 'Paradise-Guest', password shared at check-in." },
      { k: "parking", a: "Complimentary valet parking for in-house guests; ₹100/hr for visitors." },
      { k: "pet", a: "We're pet-friendly! Pets up to 15 kg, ₹1,500/night — do inform us in advance." },
      { k: "breakfast", a: "Buffet breakfast at Café Charminar, 7–10:30 AM, included in all room rates." },
      { k: "pool", a: "The rooftop infinity pool is open 6 AM – 10 PM for all guests. Towels provided." },
      { k: "smoking", a: "Smoking rooms are available on request; all suites are non-smoking." },
    ] }),

    /* — 8. reception + wrap-up — */
    N("rhand", "human_handoff", 4, 28.5, { message: "🙋 Connecting you to the front desk — a colleague will reply right here within minutes." }),
    N("gcsat", "csat", 14, 8, { question: "One last thing — how did I do today? (1–5)", field: "rating", thanks: "Thank you for the {rating}/5! 🙏" }),
    N("grev", "review_request", 15.2, 8, { message: "💚 If you enjoyed Paradise, a quick review means the world: https://g.page/hotelparadise/review" }),
    N("gbye", "goodbye", 16.4, 8, { message: "It was a pleasure assisting you! 🏨✨ Hotel Paradise, Banjara Hills — send any message to start again." }),
  ],
  edges: () => [
    /* core */
    E("w", 0, "lang"), E("lang", 0, "m"), E("lang", 1, "m"), E("lang", 2, "m"),
    E("m", 0, "rmenu"), E("m", 1, "dmenu"), E("m", 2, "simg"), E("m", 3, "elead"),
    E("m", 4, "atext"), E("m", 5, "bkid"), E("m", 6, "imenu"), E("m", 7, "rhand"),
    /* rooms */
    E("rmenu", 0, "rc1"), E("rmenu", 1, "rc2"), E("rmenu", 2, "rc3"), E("rmenu", 3, "rcat"),
    E("rcat", 0, "rmenu"), E("rc1", 0, "rbuy"), E("rc2", 0, "rbuy"), E("rc3", 0, "rbuy"),
    E("rbuy", 0, "bname"), E("rbuy", 1, "rmenu"),
    E("bname", 0, "bphone"), E("bphone", 0, "bemail"), E("bemail", 0, "bdate"),
    E("bdate", 0, "bguests"), E("bguests", 0, "bnote"), E("bnote", 0, "btag"),
    E("btag", 0, "bconfirm"), E("bconfirm", 0, "bpay"), E("bpay", 0, "bcoup"), E("bcoup", 0, "gcsat"),
    /* dining */
    E("dmenu", 0, "dtname"), E("dtname", 0, "dtguests"), E("dtguests", 0, "dttime"),
    E("dttime", 0, "dtconf"), E("dtconf", 0, "gcsat"),
    E("dmenu", 1, "rsroom"), E("rsroom", 0, "rscat"), E("rscat", 0, "rsorder"),
    E("rsorder", 0, "rsnote"), E("rsnote", 0, "rsconf"), E("rsconf", 0, "gcsat"),
    E("dmenu", 2, "dspec"), E("dspec", 0, "dcoup"), E("dcoup", 0, "gcsat"),
    E("dmenu", 3, "dhours"), E("dhours", 0, "dvenues"), E("dhours", 1, "dvenues"), E("dvenues", 0, "gbye"),
    /* spa */
    E("simg", 0, "scat"), E("scat", 0, "squick"),
    E("squick", 0, "sname"), E("squick", 1, "m"),
    E("sname", 0, "stime"), E("stime", 0, "sconf"), E("sconf", 0, "scoup"),
    E("scoup", 0, "stag"), E("stag", 0, "gcsat"),
    /* events */
    E("elead", 0, "ecat"), E("elead", 1, "ecat"), E("elead", 2, "ecat"),
    E("ecat", 0, "edate"), E("edate", 0, "eguests"), E("eguests", 0, "ephone"),
    E("ephone", 0, "enote"), E("enote", 0, "etag"), E("etag", 0, "ebroch"),
    E("ebroch", 0, "ehand"), E("ehand", 0, "gbye"),
    /* airport */
    E("atext", 0, "aq"), E("aq", 0, "aflight"), E("aq", 1, "aflight"),
    E("aflight", 0, "atime"), E("atime", 0, "aname"), E("aname", 0, "anote"),
    E("anote", 0, "aconf"), E("aconf", 0, "apay"), E("apay", 0, "gcsat"),
    /* my booking */
    E("bkid", 0, "bkstat"), E("bkstat", 0, "bkmod"),
    E("bkmod", 0, "bkhand"), E("bkhand", 0, "gbye"),
    E("bkmod", 1, "bkreason"), E("bkreason", 0, "bkcanc"), E("bkcanc", 0, "gcsat"),
    E("bkmod", 2, "bkok"), E("bkok", 0, "gbye"),
    /* info */
    E("imenu", 0, "iloc"), E("iloc", 0, "gbye"),
    E("imenu", 1, "ifac"), E("ifac", 0, "gbye"),
    E("imenu", 2, "iimg"), E("iimg", 0, "gbye"),
    E("imenu", 3, "itimes"), E("itimes", 0, "ipol"), E("ipol", 0, "gbye"),
    E("imenu", 4, "icontact"), E("icontact", 0, "gbye"),
    E("imenu", 5, "ifaq"), E("ifaq", 0, "gcsat"),
    /* reception + wrap-up */
    E("rhand", 0, "gbye"),
    E("gcsat", 0, "grev"), E("grev", 0, "gbye"),
  ],
};

/* ---------------- 🏋️ PowerFit Gym — Fitness studio ---------------- */
const gym = {
  name: "PowerFit Gym",
  emoji: "🏋️",
  desc: "Free-trial booking, membership plans & payment, class timings, location, FAQ, trainer handoff — 17 blocks.",
  nodes: () => [
    N("w", "welcome", 0, 2, { message: "🏋️ Welcome to PowerFit Gym! I'm your fitness assistant — book a free trial, check plans and class timings, right here on WhatsApp." }),
    N("m", "menu", 1, 2, { prompt: "How can I help you at PowerFit today?", options: ["Book a FREE trial", "Membership plans", "Class timings", "FAQs", "Talk to a trainer"] }),
    // — Free trial —
    N("goal", "lead_qualify", 2, 0, { prompt: "Awesome! What's your main fitness goal?", options: ["Lose weight", "Build muscle", "Stay fit & active"] }),
    N("tname", "collect", 3, 0, { question: "Love it! What name should I book the free trial under?", field: "name" }),
    N("tphone", "collect_phone", 4, 0, { question: "And your phone number, {name}?", ack: "Got it 👍" }),
    N("tslot", "appointment", 5, 0, { question: "Which day & time works for your free session? (Mon–Sat, 6 AM – 9 PM)", ack: "Checking the trainer's slots…" }),
    N("tconfirm", "booking_confirm", 6, 0, { message: "🎉 All set, {name}! Your FREE trial at PowerFit is booked for {appointmentTime}. Come 10 min early — bring water & shoes! 💪" }),
    // — Membership plans —
    N("plans", "catalog", 2, 2, { title: "💳 PowerFit membership plans", items: [
      { name: "1 Month — all access", price: "₹1,999" },
      { name: "3 Months — all access + 1 PT session", price: "₹4,999" },
      { name: "12 Months — all access + diet plan", price: "₹14,999" },
      { name: "Personal Training (per session)", price: "₹600" },
    ] }),
    N("mcoup", "coupon", 3, 2, { message: "🎁 New-member offer — 20% off any plan this week:", code: "FIT20" }),
    N("mpay", "payment_link", 4, 2, { message: "Join now — pay securely here and start today:", url: "https://rzp.io/l/powerfit-join" }),
    N("review", "review_request", 5, 2, { message: "💚 Loving PowerFit? A quick review helps other members find us: https://g.page/powerfit/review" }),
    // — Class timings + location —
    N("classes", "text", 2, 3.6, { message: "🗓️ Class timings (Mon–Sat):\n• Yoga — 6:00 & 7:00 AM\n• HIIT — 8:00 AM & 6:00 PM\n• Zumba — 5:00 PM\n• Strength — 7:00 PM\nGym floor open 5 AM – 11 PM." }),
    N("loc", "location", 3, 3.6, { title: "PowerFit Gym", address: "2nd Floor, Metro Plaza, FC Road, Pune 411005\nAmple parking · Open 5 AM – 11 PM", mapsUrl: "https://maps.google.com/?q=PowerFit+Gym+FC+Road+Pune" }),
    // — FAQ —
    N("faqs", "faq", 2, 5, { pairs: [
      { k: "trial", a: "Yes! Your first session is a free trial — no card needed. Just book a slot above." },
      { k: "timing", a: "The gym floor is open 5 AM to 11 PM daily. Group classes run Mon–Sat." },
      { k: "trainer", a: "Every plan includes a fitness assessment. Personal training is ₹600/session or bundled in the 3-month+ plans." },
      { k: "fees", a: "Plans start at ₹1,999/month. Use code FIT20 for 20% off your first plan." },
    ] }),
    // — Trainer + wrap-up —
    N("trainer", "human_handoff", 2, 6.4, { message: "🙋 Connecting you to a PowerFit trainer — they'll reply right here in a few minutes." }),
    N("csat", "csat", 6, 2, { question: "Before you go — rate your experience with me (1–5):", field: "rating", thanks: "Thanks for the {rating}/5! 💪" }),
    N("bye", "goodbye", 7, 2, { message: "See you at PowerFit! 🏋️ Send any message to start again." }),
  ],
  edges: () => [
    E("w", 0, "m"),
    E("m", 0, "goal"), E("goal", 0, "tname"), E("goal", 1, "tname"), E("goal", 2, "tname"),
    E("tname", 0, "tphone"), E("tphone", 0, "tslot"), E("tslot", 0, "tconfirm"), E("tconfirm", 0, "csat"),
    E("m", 1, "plans"), E("plans", 0, "mcoup"), E("mcoup", 0, "mpay"), E("mpay", 0, "review"), E("review", 0, "csat"),
    E("m", 2, "classes"), E("classes", 0, "loc"), E("loc", 0, "bye"),
    E("m", 3, "faqs"), E("faqs", 0, "csat"),
    E("m", 4, "trainer"), E("trainer", 0, "bye"),
    E("csat", 0, "bye"),
  ],
};

export const TEMPLATES = { restaurant, bank, chess, store, hotel, gym };
