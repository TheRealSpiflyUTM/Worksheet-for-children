import { apiRequest } from "./client.js";

export function getWorksheets() {
  return apiRequest("/api/worksheets");
}

export function getWorksheet(worksheetId) {
  return apiRequest(`/api/worksheets/${worksheetId}`);
}

export function createWorksheet(name) {
  return apiRequest("/api/worksheets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
    }),
  });
}

export function renameWorksheet(worksheetId, name) {
  return apiRequest(`/api/worksheets/${worksheetId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
    }),
  });
}

export function deleteWorksheet(worksheetId) {
  return apiRequest(`/api/worksheets/${worksheetId}`, {
    method: "DELETE",
  });
}

export function shareWorksheet(worksheetId) {
  return apiRequest(`/api/worksheets/${worksheetId}/share`, {
    method: "POST",
  });
}

export function getWorksheetItems(worksheetId) {
  return apiRequest(`/api/worksheets/${worksheetId}/items`);
}

export function createWorksheetItem(worksheetId, item) {
  return apiRequest(`/api/worksheets/${worksheetId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
}

export function updateWorksheetItem(worksheetId, itemId, item) {
  return apiRequest(`/api/worksheets/${worksheetId}/items/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
}

export function deleteWorksheetItem(worksheetId, itemId) {
  return apiRequest(`/api/worksheets/${worksheetId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function getMiniGameDefinitions() {
  return apiRequest("/api/minigames");
}