package com.worksheet.worksheet.result;

import com.worksheet.worksheet.Worksheet;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "worksheet_result")
public class WorksheetResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worksheet_id", nullable = false)
    private Worksheet worksheet;

    @Column(name = "total_score", nullable = false)
    private int totalScore;

    @Column(name = "max_score", nullable = false)
    private int maxScore;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    protected WorksheetResult() {}

    public WorksheetResult(Worksheet worksheet, int totalScore, int maxScore) {
        this.worksheet = worksheet;
        this.totalScore = totalScore;
        this.maxScore = maxScore;
        this.completedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Worksheet getWorksheet() { return worksheet; }
    public int getTotalScore() { return totalScore; }
    public int getMaxScore() { return maxScore; }
    public Instant getCompletedAt() { return completedAt; }
}