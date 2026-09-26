package com.worksheet.attempt;

import tools.jackson.databind.JsonNode;

public record SaveAttemptItemResultRequest(ItemResultOutcome outcome, int score, int maxScore,
                                           int timeSeconds, JsonNode details) {
}
