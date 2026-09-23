package com.worksheet.minigame;

import tools.jackson.databind.JsonNode;

public record MiniGameDefinitionResponse(Long id, String name, String type, JsonNode configurationSchema, boolean active) {
}