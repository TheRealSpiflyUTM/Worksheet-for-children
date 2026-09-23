package com.worksheet.minigame;

import com.fasterxml.jackson.databind.JsonNode;

public record MiniGameDefinitionResponse(Long id, String name, String type, JsonNode configurationSchema, boolean active) {
}