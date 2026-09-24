package com.worksheet.assignment;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorksheetAssignmentRepository extends JpaRepository<WorksheetAssignment, Long> {
    @EntityGraph(attributePaths = {"worksheetRevision", "worksheetRevision.worksheet",
        "worksheetRevision.worksheet.user", "user", "classroom"})
    List<WorksheetAssignment> findByWorksheetRevision_Worksheet_User_IdOrderByAssignedAtDesc(Long teacherId);
    @EntityGraph(attributePaths = {"worksheetRevision", "worksheetRevision.worksheet",
        "worksheetRevision.worksheet.user", "user", "classroom"})
    List<WorksheetAssignment> findByUser_IdAndRevokedAtIsNullOrderByAssignedAtDesc(Long userId);
    List<WorksheetAssignment> findByClassroom_IdAndUser_IdAndRevokedAtIsNull(Long classroomId, Long userId);
    boolean existsByWorksheetRevision_Worksheet_Id(Long worksheetId);

    @Override
    @EntityGraph(attributePaths = {"worksheetRevision", "worksheetRevision.worksheet",
        "worksheetRevision.worksheet.user", "user", "classroom"})
    Optional<WorksheetAssignment> findById(Long id);
}
