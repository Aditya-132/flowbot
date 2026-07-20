// ============================================================
// Whinta (app.whinta.com) WhatsApp adapter.
// - extractIncoming(): pull {from, text} out of a Whinta "Message.Received" webhook
// - sendText(): reply via POST /api/send  { phone, message }
// WHINTA_API_BASE is overridable so tests can point at a mock server.
// Whinta's webhook shape varies a little by version, so extraction digs through
// the shapes we've seen and ignores our own outbound / status events.
// ============================================================

const WHINTA_API_BASE = process.env.WHINTA_API_BASE || "https://app.whinta.com/api";

function cleanBase(apiUrl) {
  return (apiUrl || WHINTA_API_BASE).replace(/\/+$/, "");
}

function firstString(...vals) {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v;
  return "";
}

function digText(o) {
  if (!o || typeof o !== "object") return "";
  return firstString(
    o.text?.body,
    o.message?.text?.body,
    o.message?.text,
    o.message?.body,
    typeof o.text === "string" ? o.text : "",
    o.body,
    o.caption,
    o.reply?.title,
    o.button?.text,
    o.interactive?.button_reply?.title,
    o.interactive?.list_reply?.title,
    o.interactive?.title
  );
}

function digPhone(o) {
  if (!o || typeof o !== "object") return "";
  return firstString(
    o.from,
    o.phone,
    o.wa_id,
    o.sender,
    o.mobile,
    o.phone_number,
    o.contact?.phone,
    o.contact?.wa_id,
    o.contact?.phone_number,
    o.contact?.mobile,
    o.sender?.phone,
    o.sender?.wa_id
  );
}

/** Extract the first inbound message from a Whinta webhook payload. */
function extractIncoming(body) {
  const b = body || {};
  const event = String(b.event || b.type || b.event_type || b.eventType || "");
  // ignore outbound echoes, delivery/read receipts, contact/group events
  if (/sent|status|delivered|read|deliver|update|created|deleted/i.test(event)) return null;

  // Whinta wraps a Meta Cloud API "value" object (contacts[] + messages[]),
  // nested as data.data.value. Handle that shape first.
  const value =
    b?.data?.data?.value || b?.data?.value || b?.value ||
    b?.entry?.[0]?.changes?.[0]?.value || null;
  if (value && Array.isArray(value.messages) && value.messages.length) {
    const msg = value.messages.find((m) => !m.from_me) || value.messages[0];
    const from = msg.from || msg.wa_id || value.contacts?.[0]?.wa_id || digPhone(msg);
    const text =
      msg.text?.body ??
      (typeof msg.text === "string" ? msg.text : "") ??
      digText(msg);
    if (from) return { from: String(from).replace(/^whatsapp:/i, ""), text: String(text || "") };
  }

  // generic fallback for other/simpler shapes
  const nests = [b, b.data, b.payload, b.message, b.data?.message, b.data?.data, b.entry?.[0], b.messages?.[0]].filter(Boolean);
  let text = "";
  let from = "";
  for (const n of nests) {
    if (!text) text = digText(n);
    if (!from) from = digPhone(n);
  }
  if (!from) from = digPhone(b.data?.contact) || digPhone(b.contact);

  if (!from) return null;
  return { from: String(from).replace(/^whatsapp:/i, ""), text: String(text || "") };
}

/** Send a plain text WhatsApp message via Whinta. */
async function sendText(creds, to, text) {
  const url = `${cleanBase(creds.apiUrl)}/send`;
  // Whinta expects an E.164 phone; wa_id comes through as bare digits.
  const phone = /^\+/.test(String(to)) ? String(to) : "+" + String(to).replace(/[^\d]/g, "");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ phone, message: text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Whinta ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

module.exports = { extractIncoming, sendText, WHINTA_API_BASE, digText, digPhone };
