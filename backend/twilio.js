// ============================================================
// Twilio WhatsApp adapter (outbound only).
// Inbound stays TwiML request/response in server.js; this REST
// sender powers agent takeover replies and broadcasts.
// TWILIO_API_BASE is overridable so tests can point at a mock server.
// ============================================================

const TWILIO_API_BASE = process.env.TWILIO_API_BASE || "https://api.twilio.com";

/** Send a plain text WhatsApp message via the Twilio REST API. */
async function sendText(creds, to, text) {
  const url = `${TWILIO_API_BASE}/2010-04-01/Accounts/${encodeURIComponent(creds.sid)}/Messages.json`;
  // webhook From values already look like "whatsapp:+123..."; the configured
  // sender number usually doesn't — normalize both
  const withPrefix = (n) => (String(n).startsWith("whatsapp:") ? String(n) : `whatsapp:${n}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${creds.sid}:${creds.token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: withPrefix(creds.number), To: withPrefix(to), Body: text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio API ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

module.exports = { sendText, TWILIO_API_BASE };
