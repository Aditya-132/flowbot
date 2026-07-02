// Thin client for the FlowBot backend REST API.
const j = (r) => {
  if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || r.statusText)));
  return r.json();
};

export const api = {
  listFlows: () => fetch("/api/flows").then(j),
  getFlow: (id) => fetch(`/api/flows/${id}`).then(j),
  createFlow: (body) =>
    fetch("/api/flows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(j),
  updateFlow: (id, body) =>
    fetch(`/api/flows/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(j),
  deleteFlow: (id) => fetch(`/api/flows/${id}`, { method: "DELETE" }).then(j),
  activate: (id, creds) =>
    fetch(`/api/flows/${id}/activate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) }).then(j),
  simulate: (id, payload) =>
    fetch(`/api/flows/${id}/simulate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(j),
  getCode: (id) => fetch(`/api/flows/${id}/code`).then((r) => r.text()),
};
