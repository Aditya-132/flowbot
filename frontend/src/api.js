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

  listFlows: () => get("/api/flows").then(j),
  getFlow: (id) => get(`/api/flows/${id}`).then(j),
  createFlow: (body) => send("/api/flows", "POST", body).then(j),
  updateFlow: (id, body) => send(`/api/flows/${id}`, "PUT", body).then(j),
  deleteFlow: (id) => fetch(`/api/flows/${id}`, { method: "DELETE", headers: headers() }).then(j),
  activate: (id, creds) => send(`/api/flows/${id}/activate`, "POST", creds).then(j),
  simulate: (id, payload) => send(`/api/flows/${id}/simulate`, "POST", payload).then(j),
  getCode: (id) => get(`/api/flows/${id}/code`).then((r) => r.text()),
  getCodeZip: (id) =>
    get(`/api/flows/${id}/code.zip`).then((r) => {
      if (!r.ok) return Promise.reject(new Error(r.statusText));
      return r.blob();
    }),
};
