// ============================================================
// Whapi.cloud WhatsApp adapter.
// - extractIncoming(): pull {from, text} out of a Whapi webhook
// - sendText(): reply via POST /messages/text
// WHAPI_API_BASE is overridable so tests can point at a mock server.
// ============================================================

const WHAPI_API_BASE = process.env.WHAPI_API_BASE || "https://gate.whapi.cloud";

function cleanBase(apiUrl) {
  return (apiUrl || WHAPI_API_BASE).replace(/\/+$/, "");
}

function extractText(msg) {
  return (
    msg?.text?.body ??
    msg?.link_preview?.body ??
    msg?.reply?.buttons_reply?.title ??
    msg?.reply?.list_reply?.title ??
    msg?.interactive?.body ??
    msg?.document?.caption ??
    msg?.image?.caption ??
    msg?.video?.caption ??
    ""
  );
}

/** Extract the first inbound message from a Whapi webhook payload. */
function extractIncoming(body) {
  const msg = (body?.messages || []).find((m) => !m.from_me);
  if (!msg) return null;
  const from = msg.chat_id || msg.from || "";
  if (!from) return null;
  return { from, text: extractText(msg), id: msg.id };
}

/** Send a plain text message via Whapi.cloud. */
async function sendText(creds, to, text) {
  const url = `${cleanBase(creds.apiUrl)}/messages/text`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, body: text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Whapi ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

module.exports = { extractIncoming, sendText, WHAPI_API_BASE };
