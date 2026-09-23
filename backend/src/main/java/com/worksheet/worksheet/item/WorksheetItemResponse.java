package com.worksheet.worksheet.item;

import tools.jackson.databind.JsonNode;

public record WorksheetItemResponse(Long id, Long worksheetId, Long miniGameId, int orderIndex, JsonNode configuration) {
}