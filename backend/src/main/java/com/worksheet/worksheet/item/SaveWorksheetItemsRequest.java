package com.worksheet.worksheet.item;

import java.util.List;
import tools.jackson.databind.JsonNode;

public record SaveWorksheetItemsRequest(List<Item> items) {
    public record Item(Long id, Long miniGameId, int orderIndex, JsonNode configuration) {}
}
