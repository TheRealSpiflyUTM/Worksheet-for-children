import { apiRequest } from "./client.js";

export function getWorksheets() {
    return apiRequest("/api/worksheets");
}

export function getWorksheet(worksheetId){
    return apiRequest(`/api/worksheets/${worksheetId}`);
}

export function createWorksheet(name){
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

export function renameWorksheet(worksheetId , name){
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

export function deleteWorksheet(worksheetId){
    return apiRequest(`/api/worksheets/${worksheetId}`, {
        method: "DELETE",
    });
}