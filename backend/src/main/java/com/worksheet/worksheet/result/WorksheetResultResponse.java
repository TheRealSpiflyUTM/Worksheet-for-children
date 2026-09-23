package com.worksheet.worksheet.result;

import java.time.Instant;

public record WorksheetResultResponse(Long id, Long worksheetId, int totalScore, int maxScore, Instant completedAt) {
}