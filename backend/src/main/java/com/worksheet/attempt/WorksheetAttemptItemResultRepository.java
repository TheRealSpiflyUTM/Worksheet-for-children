package com.worksheet.attempt;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorksheetAttemptItemResultRepository extends JpaRepository<WorksheetAttemptItemResult, Long> {
    @EntityGraph(attributePaths = {"revisionItem"})
    List<WorksheetAttemptItemResult> findByAttempt_IdOrderByRevisionItem_OrderIndex(Long attemptId);
    Optional<WorksheetAttemptItemResult> findByAttempt_IdAndRevisionItem_Id(Long attemptId, Long revisionItemId);
    long countByAttempt_Id(Long attemptId);
}
