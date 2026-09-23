package com.worksheet.worksheets;

import java.time.Instant;

public record WorksheetResponse(Long id, String name, Instant createdAt, Instant updatedAt) {
}