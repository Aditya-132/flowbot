// Thin client for the FlowBot backend REST API.
const TOKEN_KEY = "flowbot_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const j = (r) => {
  if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || r.statusText)));
  return r.json();
};

const headers = (extra = {}) => {
  const token = getToken();
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const get = (url) => fetch(url, { headers: headers() });
const send = (url, method, body) =>
  fetch(url, { method, headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify(body) });

export const api = {
  signup: (body) => send("/api/auth/signup", "POST", body).then(j),
  login: (body) => send("/api/auth/login", "POST", body).then(j),
  logout: () => send("/api/auth/logout", "POST", {}).then(j),
  me: () => get("/api/auth/me").then(j),

  assistant: (body) => send("/api/assistant", "POST", body).then(j),

  listBlocks: () => get("/api/blocks").then(j),
  createBlock: (body) => send("/api/blocks", "POST", body).then(j),
  updateBlock: (id, body) => send(`/api/blocks/${id}`, "PUT", body).then(j),
  deleteBlock: (id) => fetch(`/api/blocks/${id}`, { method: "DELETE", headers: headers() }).then(j),

  listFlows: () => get("/api/flows").then(j),
  getFlow: (id) => get(`/api/flows/${id}`).then(j),
  createFlow: (body) => send("/api/flows", "POST", body).then(j),
  updateFlow: (id, body) => send(`/api/flows/${id}`, "PUT", body).then(j),
  deleteFlow: (id) => fetch(`/api/flows/${id}`, { method: "DELETE", headers: headers() }).then(j),
  activate: (id, creds) => send(`/api/flows/${id}/activate`, "POST", creds).then(j),
  deactivate: (id) => send(`/api/flows/${id}/deactivate`, "POST", {}).then(j),
  publish: (id, body) => send(`/api/flows/${id}/publish`, "POST", body).then(j),
  analytics: (id) => get(`/api/flows/${id}/analytics`).then(j),
  funnel: (id) => get(`/api/flows/${id}/funnel`).then(j),
  replay: (id, key) => get(`/api/flows/${id}/replay?key=${encodeURIComponent(key)}`).then(j),
  inbox: (id) => get(`/api/flows/${id}/inbox`).then(j),
  inboxThread: (id, key) => get(`/api/flows/${id}/inbox/thread?key=${encodeURIComponent(key)}`).then(j),
  inboxAgent: (id, key, on) => send(`/api/flows/${id}/inbox/agent`, "POST", { key, on }).then(j),
  inboxSend: (id, key, message) => send(`/api/flows/${id}/inbox/send`, "POST", { key, message }).then(j),
  broadcasts: (id) => get(`/api/flows/${id}/broadcasts`).then(j),
  createBroadcast: (id, message) => send(`/api/flows/${id}/broadcasts`, "POST", { message }).then(j),
  getSharedFlow: (key) => fetch(`/api/share/${key}/flow`).then(j),
  simulate: (id, payload) => send(`/api/flows/${id}/simulate`, "POST", payload).then(j),
  getCode: (id) => get(`/api/flows/${id}/code`).then((r) => r.text()),
  getCodeZip: (id) =>
    get(`/api/flows/${id}/code.zip`).then((r) => {
      if (!r.ok) return Promise.reject(new Error(r.statusText));
      return r.blob();
    }),
};
