// ============================================================
// Meta WhatsApp Cloud API adapter.
// - extractIncoming(): pull {from, text} out of a webhook payload
// - sendText(): reply via Graph API POST /<PHONE_NUMBER_ID>/messages
// GRAPH_API_BASE is overridable so tests can point at a mock server.
// ============================================================

const GRAPH_API_BASE = process.env.GRAPH_API_BASE || "https://graph.facebook.com/v23.0";

/** Extract the first incoming message from a Cloud API webhook payload. */
function extractIncoming(body) {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return null; // status updates (sent/delivered/read) also arrive here — ignore
  const text =
    msg.text?.body ??
    msg.interactive?.button_reply?.title ??
    msg.interactive?.list_reply?.title ??
    msg.button?.text ??
    "";
  return { from: msg.from, text, id: msg.id, selectedId: msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || null };
}

/** Send a plain text message via the Graph API. */
async function sendText(creds, to, text) {
  const url = `${GRAPH_API_BASE}/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Graph API ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}


/** Send a native WhatsApp interactive list message. */
async function sendInteractiveList(creds, to, spec) {
  const rows = (spec.rows || []).slice(0, 10).map((row, i) => ({
    id: String(row.id || `option_${i + 1}`).slice(0, 200),
    title: String(row.title || `Option ${i + 1}`).slice(0, 24),
    ...(row.description ? { description: String(row.description).slice(0, 72) } : {}),
  }));
  if (!rows.length) throw new Error("WhatsApp interactive list needs at least one row");
  const body = {
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive",
    interactive: {
      type: "list",
      body: { text: String(spec.body || "Please choose an option.").slice(0, 1024) },
      action: { button: String(spec.buttonText || "View options").slice(0, 20), sections: [{ title: String(spec.sectionTitle || "Options").slice(0, 24), rows }] },
    },
  };
  const url = `${GRAPH_API_BASE}/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${creds.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { const detail = await res.text().catch(() => ""); throw new Error(`Graph API ${res.status}: ${detail.slice(0, 300)}`); }
  return res.json();
}

/** Send an image / video / document / audio by URL via the Graph API. */
async function sendMedia(creds, to, spec) {
  const type = ["image", "video", "document", "audio"].includes(spec.mediaType) ? spec.mediaType : "document";
  const media = { link: spec.url };
  if (spec.caption && type !== "audio") media.caption = spec.caption; // audio has no caption field
  const url = `${GRAPH_API_BASE}/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type, [type]: media }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Graph API ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

module.exports = { extractIncoming, sendText, sendInteractiveList, sendMedia, GRAPH_API_BASE };
