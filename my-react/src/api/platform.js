import { apiRequest, send } from "./client.js";

export const platformApi = {
  me: () => apiRequest("/api/auth/me"),
  logout: () => send("/api/auth/logout"),
  worksheets: () => apiRequest("/api/worksheets"),
  worksheet: (id) => apiRequest(`/api/worksheets/${id}`),
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
  addStudent: (id, name) => send(`/api/classes/${id}/members`, "POST", { name }),
  issueStudentCode: (id, userId) => send(`/api/classes/${id}/members/${userId}/code`),
  renameStudent: (id, userId, name) => send(`/api/classes/${id}/members/${userId}`, "PATCH", { name }),
  studentTests: (id, userId) => apiRequest(`/api/classes/${id}/members/${userId}/tests`),
  startClassTest: (id, worksheetId) => send(`/api/classes/${id}/tests`, "POST", { worksheetId }),
  enterGame: (studentCode, worksheetCode) => send("/api/play/join", "POST", {
    studentCode: studentCode.trim().toUpperCase(), worksheetCode: worksheetCode.trim().toUpperCase(),
  }),
  removeMember: (id, userId) =>
    send(`/api/classes/${id}/members/${userId}`, "DELETE"),
  rotateClass: (id) => send(`/api/classes/${id}/join-code/rotate`),
  assignments: () => apiRequest("/api/assignments"),
  assignment: (id) => apiRequest(`/api/assignments/${id}`),
  assign: (worksheetId, body) =>
    send(`/api/worksheets/${worksheetId}/assignments`, "POST", body),
  history: (id, personal = false) =>
    apiRequest(`/api/${personal ? "worksheets" : "assignments"}/${id}/attempts`),
  start: (id, personal = false) =>
    send(`/api/${personal ? "worksheets" : "assignments"}/${id}/attempts`),
  attempt: (id) => apiRequest(`/api/attempts/${id}`),
  result: (attemptId, itemId, result) =>
    send(`/api/attempts/${attemptId}/items/${itemId}/result`, "PUT", result),
  complete: (id) => send(`/api/attempts/${id}/complete`),
  definitions: () => apiRequest("/api/minigames"),
  slots: (id) => apiRequest(`/api/minigames/${id}/image-slots`),
  images: (page = 0) => apiRequest(`/api/minigame-assets?page=${page}&size=20`),
  upload: (definitionId, slotKey, file) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest(
      `/api/minigames/${definitionId}/image-slots/${slotKey}/uploads`,
      { method: "POST", body }
    );
  },
};
