package com.worksheet.attempt;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorksheetAttemptRepository extends JpaRepository<WorksheetAttempt, Long> {
    @EntityGraph(attributePaths = {"revision", "revision.worksheet", "revision.worksheet.user", "assignment", "assignment.user"})
    List<WorksheetAttempt> findByAssignment_IdOrderByStartedAtDesc(Long assignmentId);
    List<WorksheetAttempt> findByAssignment_IdAndStatus(Long assignmentId, AttemptStatus status);
    boolean existsByAssignment_IdAndStatus(Long assignmentId, AttemptStatus status);
    @EntityGraph(attributePaths = {"revision", "revision.worksheet", "revision.worksheet.user", "assignment", "assignment.user"})
    List<WorksheetAttempt> findByRevision_Worksheet_IdAndAssignmentIsNullOrderByStartedAtDesc(Long worksheetId);

    @Override
    @EntityGraph(attributePaths = {"revision", "revision.worksheet", "revision.worksheet.user", "assignment", "assignment.user"})
    Optional<WorksheetAttempt> findById(Long id);
}
