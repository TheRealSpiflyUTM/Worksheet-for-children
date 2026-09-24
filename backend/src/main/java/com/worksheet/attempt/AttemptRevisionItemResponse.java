package com.worksheet.attempt;

import tools.jackson.databind.JsonNode;

public record AttemptRevisionItemResponse(Long id, Long miniGameId, int orderIndex, JsonNode configuration) {
}
