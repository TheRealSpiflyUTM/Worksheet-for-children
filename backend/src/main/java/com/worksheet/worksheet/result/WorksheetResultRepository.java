package com.worksheet.worksheet.result;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorksheetResultRepository extends JpaRepository<WorksheetResult, Long> {
    List<WorksheetResult> findByWorksheet_IdAndWorksheet_User_IdAndAssignmentIsNullOrderByCompletedAtDesc(Long worksheetId, Long userId);
    Optional<WorksheetResult> findByIdAndWorksheet_IdAndWorksheet_User_IdAndAssignmentIsNull(Long id, Long worksheetId, Long userId);
    List<WorksheetResult> findByAssignment_IdOrderByCompletedAtDesc(Long assignmentId);
    boolean existsByAssignment_Id(Long assignmentId);
}
