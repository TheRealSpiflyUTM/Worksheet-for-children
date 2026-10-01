package com.worksheet.classroom;

import com.worksheet.attempt.AttemptStatus;
import java.time.Instant;

public record StudentTestResponse(Long attemptId, Long assignmentId, String name, AttemptStatus status,
    int totalScore, int maxScore, Instant startedAt, Instant completedAt) {}
