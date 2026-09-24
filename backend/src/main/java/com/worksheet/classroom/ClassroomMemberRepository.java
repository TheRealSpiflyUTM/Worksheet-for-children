package com.worksheet.classroom;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassroomMemberRepository extends JpaRepository<ClassroomMember, Long> {
    List<ClassroomMember> findByUser_IdAndLeftAtIsNullOrderByJoinedAtDesc(Long userId);
    List<ClassroomMember> findByClassroom_IdAndLeftAtIsNullOrderByJoinedAt(Long classroomId);
    Optional<ClassroomMember> findByClassroom_IdAndUser_Id(Long classroomId, Long userId);
    Optional<ClassroomMember> findByClassroom_IdAndUser_IdAndLeftAtIsNull(Long classroomId, Long userId);
    boolean existsByClassroom_IdAndUser_IdAndLeftAtIsNull(Long classroomId, Long userId);
    boolean existsByClassroom_Teacher_IdAndUser_IdAndLeftAtIsNull(Long teacherId, Long userId);
    Optional<ClassroomMember> findFirstByClassroom_Teacher_IdAndUser_IdAndLeftAtIsNullOrderByJoinedAt(Long teacherId, Long userId);
}
