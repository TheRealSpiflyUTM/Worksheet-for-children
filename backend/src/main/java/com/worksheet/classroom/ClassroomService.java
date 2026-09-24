package com.worksheet.classroom;

import com.worksheet.assignment.WorksheetAssignment;
import com.worksheet.assignment.WorksheetAssignmentRepository;
import com.worksheet.attempt.WorksheetAttemptService;
import com.worksheet.auth.User;
import com.worksheet.auth.UserRole;
import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ClassroomService {
    private static final char[] CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private final SecureRandom random = new SecureRandom();
    private final ClassroomRepository classrooms;
    private final ClassroomMemberRepository members;
    private final WorksheetAssignmentRepository assignments;
    private final WorksheetAttemptService attempts;

    public ClassroomService(ClassroomRepository classrooms, ClassroomMemberRepository members,
                            WorksheetAssignmentRepository assignments, WorksheetAttemptService attempts) {
        this.classrooms = classrooms;
        this.members = members;
        this.assignments = assignments;
        this.attempts = attempts;
    }

    public ClassroomResponse create(User teacher, CreateClassroomRequest request) {
        requireRole(teacher, UserRole.TEACHER);
        String name = request.name() == null ? "" : request.name().strip();
        if(name.isEmpty() || name.length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class name must contain 1 to 150 characters.");
        }
        return toResponse(classrooms.save(new Classroom(teacher, name, nextJoinCode())), true);
    }

    public List<ClassroomResponse> getAll(User actor) {
        if(actor.getRole() == UserRole.TEACHER) {
            return classrooms.findByTeacher_IdOrderByCreatedAtDesc(actor.getId()).stream()
                .map(classroom -> toResponse(classroom, true)).toList();
        }
        return members.findByUser_IdAndLeftAtIsNullOrderByJoinedAtDesc(actor.getId()).stream()
            .map(member -> toResponse(member.getClassroom(), false)).toList();
    }

    public ClassroomResponse getById(Long classroomId, User actor) {
        Classroom classroom = classrooms.findById(classroomId)
            .orElseThrow(() -> notFound());
        boolean teacher = classroom.getTeacher().getId().equals(actor.getId());
        boolean member = members.existsByClassroom_IdAndUser_IdAndLeftAtIsNull(classroomId, actor.getId());
        if(!teacher && !member) throw notFound();
        return toResponse(classroom, teacher);
    }

    @Transactional
    public ClassroomResponse join(User user, JoinClassroomRequest request) {
        requireRole(user, UserRole.USER);
        String code = normalizeCode(request.joinCode());
        Classroom classroom = classrooms.findByJoinCode(code).orElseThrow(() -> notFound());
        ClassroomMember membership = members.findByClassroom_IdAndUser_Id(classroom.getId(), user.getId()).orElse(null);
        if(membership != null && membership.getLeftAt() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This user is already an active class member.");
        }
        if(membership == null) members.save(new ClassroomMember(classroom, user));
        else {
            membership.rejoin();
            members.save(membership);
        }
        return toResponse(classroom, false);
    }

    public List<ClassroomMemberResponse> getMembers(Long classroomId, User teacher) {
        requireOwnedClassroom(classroomId, teacher);
        return members.findByClassroom_IdAndLeftAtIsNullOrderByJoinedAt(classroomId).stream()
            .map(member -> new ClassroomMemberResponse(member.getUser().getId(), member.getUser().getName(), member.getUser().getEmail(), member.getJoinedAt()))
            .toList();
    }

    @Transactional
    public void removeMember(Long classroomId, Long userId, User teacher) {
        requireOwnedClassroom(classroomId, teacher);
        ClassroomMember membership = members.findByClassroom_IdAndUser_IdAndLeftAtIsNull(classroomId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class member not found."));
        membership.leave();
        members.save(membership);
        List<WorksheetAssignment> activeAssignments = assignments.findByClassroom_IdAndUser_IdAndRevokedAtIsNull(classroomId, userId);
        activeAssignments.forEach(WorksheetAssignment::revoke);
        assignments.saveAll(activeAssignments);
        attempts.abandonActiveForAssignments(activeAssignments);
    }

    public ClassroomResponse rotateJoinCode(Long classroomId, User teacher) {
        Classroom classroom = requireOwnedClassroom(classroomId, teacher);
        classroom.rotateJoinCode(nextJoinCode());
        return toResponse(classrooms.save(classroom), true);
    }

    public Classroom requireOwnedClassroom(Long classroomId, User teacher) {
        requireRole(teacher, UserRole.TEACHER);
        return classrooms.findByIdAndTeacher_Id(classroomId, teacher.getId())
            .orElseThrow(() -> notFound());
    }

    private ClassroomResponse toResponse(Classroom classroom, boolean includeJoinCode) {
        return new ClassroomResponse(classroom.getId(), classroom.getName(), classroom.getTeacher().getId(),
            classroom.getTeacher().getName(), includeJoinCode ? classroom.getJoinCode() : null, classroom.getCreatedAt());
    }

    private String nextJoinCode() {
        String code;
        do {
            StringBuilder value = new StringBuilder(8);
            for(int index = 0; index < 8; index++) value.append(CODE_CHARS[random.nextInt(CODE_CHARS.length)]);
            code = value.toString();
        } while(classrooms.existsByJoinCode(code));
        return code;
    }

    private String normalizeCode(String code) {
        if(code == null || code.isBlank()) throw notFound();
        return code.strip().toUpperCase(Locale.ROOT);
    }

    private void requireRole(User user, UserRole role) {
        if(user.getRole() != role) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account does not have permission for this action.");
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found.");
    }
}
