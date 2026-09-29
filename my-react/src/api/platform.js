import { apiRequest, send } from "./client.js";
export const api = {
  me: () => apiRequest("/api/auth/me"),
  login: (body) => send("/api/auth/login", "POST", body),
  signup: (body) => send("/api/auth/signup", "POST", body),
  logout: () => send("/api/auth/logout"),
  worksheets: () => apiRequest("/api/worksheets"),
  worksheet: (id) => apiRequest(`/api/worksheets/${id}`),
  createWorksheet: (name) => send("/api/worksheets", "POST", { name }),
  renameWorksheet: (id, name) => send(`/api/worksheets/${id}`, "PUT", { name }),
  deleteWorksheet: (id) => send(`/api/worksheets/${id}`, "DELETE"),
  saveItem: (id, item) =>
    send(
      `/api/worksheets/${id}/items${item.id ? `/${item.id}` : ""}`,
      item.id ? "PUT" : "POST",
      {
        miniGameId: item.miniGameId,
        orderIndex: item.orderIndex,
        configuration: item.configuration,
      },
    ),
  deleteItem: (id, itemId) =>
    send(`/api/worksheets/${id}/items/${itemId}`, "DELETE"),
  definitions: () => apiRequest("/api/minigames"),
  share: (id, rotate = false) =>
    send(`/api/worksheets/${id}/share${rotate ? "/rotate" : ""}`),
  joinWorksheet: (code) =>
    send("/api/worksheets/join", "POST", { code: code.trim().toUpperCase() }),
  classes: () => apiRequest("/api/classes"),
  classroom: (id) => apiRequest(`/api/classes/${id}`),
  createClass: (name) => send("/api/classes", "POST", { name }),
  joinClass: (code) =>
    send("/api/classes/join", "POST", { joinCode: code.trim().toUpperCase() }),
  members: (id) => apiRequest(`/api/classes/${id}/members`),
  removeMember: (id, userId) =>
    send(`/api/classes/${id}/members/${userId}`, "DELETE"),
  rotateClass: (id) => send(`/api/classes/${id}/join-code/rotate`),
  assignments: () => apiRequest("/api/assignments"),
  assignment: (id) => apiRequest(`/api/assignments/${id}`),
  assign: (id, body) => send(`/api/worksheets/${id}/assignments`, "POST", body),
  history: (id, personal = false) =>
    apiRequest(
      `/api/${personal ? "worksheets" : "assignments"}/${id}/attempts`,
    ),
  start: (id, personal = false) =>
    send(`/api/${personal ? "worksheets" : "assignments"}/${id}/attempts`),
  attempt: (id) => apiRequest(`/api/attempts/${id}`),
  result: (id, itemId, result) =>
    send(`/api/attempts/${id}/items/${itemId}/result`, "PUT", result),
  complete: (id) => send(`/api/attempts/${id}/complete`),
  slots: (id) => apiRequest(`/api/minigames/${id}/image-slots`),
  images: (page = 0) => apiRequest(`/api/minigame-assets?page=${page}&size=20`),
  upload: (id, key, file) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest(`/api/minigames/${id}/image-slots/${key}/uploads`, {
      method: "POST",
      body,
    });
  },
};
