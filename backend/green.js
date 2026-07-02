// ============================================================
// Green API WhatsApp adapter.
// - extractIncoming(): pull {from, text} out of a Green API webhook
// - sendText(): reply via sendMessage
// GREEN_API_BASE is overridable so tests can point at a mock server.
// ============================================================

const GREEN_API_BASE = process.env.GREEN_API_BASE || "https://api.green-api.com";

function cleanBase(apiUrl) {
  return (apiUrl || GREEN_API_BASE).replace(/\/+$/, "");
}

function normalizeChatId(chatId) {
  if (!chatId) return "";
  return chatId.includes("@") ? chatId : `${chatId}@c.us`;
}

/** Extract the first incoming text-ish message from a Green API webhook payload. */
function extractIncoming(body) {
  if (body?.typeWebhook !== "incomingMessageReceived") return null;
  const messageData = body.messageData || {};
  const text =
    messageData.textMessageData?.textMessage ??
    messageData.extendedTextMessageData?.text ??
    messageData.quotedMessage?.textMessage ??
    "";
  const from = body.senderData?.chatId || body.senderData?.sender || "";
  if (!from) return null;
  return { from, text, id: body.idMessage };
}

/** Send a plain text message via Green API sendMessage. */
async function sendText(creds, chatId, text) {
  const idInstance = creds.idInstance;
  const apiTokenInstance = creds.apiTokenInstance;
  const url = `${cleanBase(creds.apiUrl)}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: normalizeChatId(chatId),
      message: text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Green API ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

module.exports = { extractIncoming, sendText, GREEN_API_BASE };
